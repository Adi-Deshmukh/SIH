import pulp as pl
from sklearn.ensemble import RandomForestRegressor
import numpy as np
import logging

logger = logging.getLogger(__name__)

class LLMDecisionEngine:
    def generate_insight(self, result, section):
        overrides = sum(1 for a in result['assignments'] if a['track'] != a['pre_track'])
        return f"Optimized {len(result['assignments'])} trains in {section}; overrides: {overrides} due to congestion/disruptions. Delay reduction: {result['kpis']['delay_reduction']:.1f}%"

class Optimizer:
    def __init__(self):
        self.ml_model = RandomForestRegressor(n_estimators=20, random_state=42)
        self.llm = LLMDecisionEngine()
        self.train_ml_model()

    def train_ml_model(self):
        X = np.array([[5, 2, 0.2], [10, 5, 0.5], [2, 1, 0.1]])
        y = np.array([0.4, 0.75, 0.25])
        self.ml_model.fit(X, y)
        logger.info("ML trained with placeholder data")

    def predict_occupancy(self, current_state, tracks):
        features = [[current_state['num_trains'], current_state['avg_delay'], current_state['weather_score']] for _ in tracks]
        predictions = self.ml_model.predict(features)
        return {tracks[i]: predictions[i] for i in range(len(tracks))}

    def solve_assignment(self, trains_subset, tracks, pre_tracks, ml_weights, disruption=None, what_if=None, section="SBC-MYS", stations={}):
        logger.info(f"MILP for {len(trains_subset)} trains in {section}")
        prob = pl.LpProblem("Train_Opt", pl.LpMinimize)
        train_ids = [t['id'] for t in trains_subset]
        P = [1, 2]
        max_dur = max(t['duration'] for t in trains_subset) if trains_subset else 1
        time_slots = list(range(int(max_dur + 10)))

        x = pl.LpVariable.dicts("assign", (train_ids, tracks), cat='Binary')
        y = pl.LpVariable.dicts("reroute", (train_ids, P), cat='Binary')
        start_t = pl.LpVariable.dicts("start", train_ids, lowBound=0)
        prec = pl.LpVariable.dicts("precedence", (train_ids, train_ids), cat='Binary')

        # Objective with via penalty
        via_penalty = lpSum([(start_t[tid] - trains_subset[i]['arrival']) * (2 if trains_subset[i].get('via', False) else 1) for i, tid in enumerate(train_ids)])
        delay = lpSum([(start_t[tid] - trains_subset[i]['arrival']) / trains_subset[i]['priority'] for i, tid in enumerate(train_ids)])
        occupancy_penalty = lpSum([x[tid][k] * ml_weights.get(k, 0) for tid in train_ids for k in tracks])
        override_penalty = lpSum([1 - x[tid][pre_tracks.get(tid, tracks[0])] for tid in train_ids]) * 0.5
        prob += delay + occupancy_penalty + override_penalty + via_penalty

        # Constraints
        for tid in train_ids:
            prob += lpSum(x[tid][k] for k in tracks) == 1
            prob += lpSum(y[tid][p] for p in P) == 1
            prob += start_t[tid] >= trains_subset[train_ids.index(tid)]['arrival']

        for tid1 in train_ids:
            for tid2 in train_ids:
                if tid1 != tid2:
                    for k in tracks:
                        prob += start_t[tid1] + trains_subset[train_ids.index(tid1)]['duration'] + 5 <= start_t[tid2] + 1000 * (3 - x[tid1][k] - x[tid2][k] - prec[tid1][tid2])
                        prob += start_t[tid2] + trains_subset[train_ids.index(tid2)]['duration'] + 5 <= start_t[tid1] + 1000 * (3 - x[tid1][k] - x[tid2][k] - prec[tid2][tid1])

        for tid1 in train_ids:
            for tid2 in train_ids:
                if tid1 != tid2 and trains_subset[train_ids.index(tid1)]['priority'] > trains_subset[train_ids.index(tid2)]['priority']:
                    prob += prec[tid1][tid2] == 1

        for k in tracks:
            prob += lpSum(x[tid][k] for tid in train_ids) <= 1

        if disruption:
            blocked_k = disruption.get('track')
            if blocked_k in tracks:
                for tid in train_ids:
                    prob += x[tid][blocked_k] == 0
                    prob += y[tid][2] == 1

        # Platform constraint
        for station, plats in stations.items():
            prob += lpSum([x[tid][k] for tid in train_ids if trains_subset[train_ids.index(tid)]['dest'] == station]) <= plats

        if what_if and 'hold_min' in what_if:
            for tid in train_ids:
                prob += start_t[tid] >= trains_subset[train_ids.index(tid)]['arrival'] + what_if['hold_min']

        prob.solve()
        if pl.LpStatus[prob.status] != 'Optimal':
            return {'status': 'infeasible', 'insight': 'No feasible solution'}

        assignments = []
        total_delay = 0
        for i, tid in enumerate(train_ids):
            assign_track = next(k for k in tracks if value(x[tid][k]) == 1)
            assign_path = next(p for p in P if value(y[tid][p]) == 1)
            delay_val = value(start_t[tid]) - trains_subset[i]['arrival']
            assignments.append({'id': tid, 'track': assign_track, 'path': assign_path, 'start': value(start_t[tid]), 'delay': delay_val, 'pre_track': pre_tracks.get(tid, assign_track)})
            total_delay += delay_val

        baseline_delay = sum(t['duration'] for t in trains_subset) * 0.1
        kpis = {'delay_reduction': (baseline_delay - total_delay) / baseline_delay * 100 if baseline_delay > 0 else 0}
        insight = self.llm.generate_insight({'assignments': assignments, 'kpis': kpis}, section)
        return {'assignments': assignments, 'kpis': kpis, 'insight': insight}
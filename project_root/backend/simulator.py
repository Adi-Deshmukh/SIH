# simulator.py - 24-minute simulation loop, updates train positions
# Placeholder for train simulation logic
import time
import random
from backend.optimizer import Optimizer
from backend.utils import load_trains, parse_geojson
import logging
import numpy as np

logger = logging.getLogger(__name__)

class Simulator:
    def __init__(self, section="SBC-MYS"):
        self.section = section
        self.optimizer = Optimizer()
        self.trains = load_trains()  # Load for section (filter in load if needed)
        self.sections_data = parse_geojson()  # {'tracks': [1,2], 'junctions': [...], 'stations': {'SBC': 10, 'MYS': 6}}
        self.sim_state = {t['id']: {'pos': 0, 'delay': 0, 'track': t.get('pre_track', 1)} for t in self.trains}
        self.disruptions = []

    def run_sim(self):
        logger.info(f"Starting {self.section} simulation")
        for tick in range(24):
            logger.info(f"Tick {tick}")
            for t in self.trains:
                self.sim_state[t['id']]['pos'] += t['speed'] / 60
                if random.random() < 0.1:
                    self.disruptions.append({'track': random.choice(self.sections_data['tracks']), 'type': 'block', 'duration': 10})
            
            for t in self.trains:
                current_state = self.get_current_state()
                ml_occupancy = self.optimizer.predict_occupancy(current_state, self.sections_data['tracks'])
                disruption = next((d for d in self.disruptions if d['duration'] > 0), None)
                if disruption:
                    disruption['duration'] -= 1
                
                if self.check_trigger(t, tick, self.sections_data['junctions'], current_state, ml_occupancy, disruption):
                    subset = self.get_upcoming(t, self.trains, tick)
                    pre_tracks = {s['id']: s.get('pre_track', self.sections_data['tracks'][0]) for s in subset}
                    result = self.optimizer.solve_assignment(subset, self.sections_data['tracks'], pre_tracks, ml_occupancy, disruption, section=self.section, stations=self.sections_data['stations'])
                    for assign in result['assignments']:
                        self.sim_state[assign['id']].update({'track': assign['track'], 'delay': assign['delay']})
                    logger.info(result['insight'])
                    self.notify_dashboards(result)

    def check_trigger(self, train, sim_time, junctions, current_state, ml_occupancy, disruption):
        nearest_dist = min(abs(self.sim_state[train['id']]['pos'] - j['km'] for j in junctions))
        time_to = nearest_dist / train['speed'] * 60
        if nearest_dist < 20 or time_to < 15:
            return True
        if any(v > 0.7 for v in ml_occupancy.values()):
            return True
        if disruption:
            return True
        return False

    def get_current_state(self):
        trains_in = [t for t in self.trains if t['section'] == self.section]
        return {'num_trains': len(trains_in), 'avg_delay': np.mean([self.sim_state[t['id']]['delay'] for t in trains_in]), 'weather_score': random.uniform(0.1, 0.3)}

    def get_upcoming(self, train, all_trains, sim_time):
        upcoming = [t for t in all_trains if t['section'] == self.section and sim_time <= t['arrival'] < sim_time + 0.5][:10]
        for u in upcoming:
            u['via'] = u['origin'] != self.section.split('-')[0] or u['dest'] != self.section.split('-')[1]
        return upcoming

    def notify_dashboards(self, result):
        logger.info("Notifications: " + result['insight'])
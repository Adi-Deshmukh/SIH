from flask import Flask, jsonify, request
from backend.simulator import Simulator
import logging

app = Flask(__name__)
logger = logging.getLogger(__name__)
sim = Simulator(section="SBC-MYS")  # Configurable section

@app.route('/get_update', methods=['GET'])
def get_update():
    train_id = request.args.get('train_id')
    result = {'status': 'ok', 'assignment': sim.sim_state.get(train_id, {'track': 1, 'delay': 0})}
    return jsonify(result)

@app.route('/what_if', methods=['POST'])
def what_if():
    params = request.json
    result = sim.optimizer.solve_assignment(sim.trains[:10], sim.sections_data['tracks'], {t['id']: t.get('pre_track', 1) for t in sim.trains[:10]}, {}, what_if=params, stations=sim.sections_data['stations'])
    return jsonify(result)

if __name__ == '__main__':
    sim.run_sim()  # Run sim on start
    app.run(debug=True)
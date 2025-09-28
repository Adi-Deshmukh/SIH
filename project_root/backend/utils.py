# utils.py - Helpers: load JSON, parse GeoJSON, calculate KPIs
# Placeholder for utility functions

import json
import logging

logger = logging.getLogger(__name__)

def load_trains(file='data/trains.json'):
    sample = [
        {"id": "12609", "origin": "MAS", "dest": "MYS", "arrival": 12.75, "duration": 2.75, "speed": 50, "priority": 3, "pre_track": 1, "section": "SBC-MYS", "pos": 0, "delay": 0},  # Via (MAS not SBC)
        {"id": "16220", "origin": "TPTY", "dest": "MYS", "arrival": 4.5, "duration": 2.67, "speed": 52, "priority": 3, "pre_track": 1, "section": "SBC-MYS", "pos": 0, "delay": 0},
        {"id": "17326", "origin": "UBL", "dest": "MYS", "arrival": 5.67, "duration": 3.0, "speed": 46, "priority": 3, "pre_track": 1, "section": "SBC-MYS", "pos": 0, "delay": 0},
        {"id": "16536", "origin": "UBL", "dest": "MYS", "arrival": 7.25, "duration": 3.0, "speed": 46, "priority": 3, "pre_track": 1, "section": "SBC-MYS", "pos": 0, "delay": 0},
        {"id": "FR-001", "origin": "SBC", "dest": "MYS", "arrival": 2.0, "duration": 4.0, "speed": 35, "priority": 1, "pre_track": 2, "section": "SBC-MYS", "pos": 0, "delay": 0},
        # Add 45 more for 50 total; via if origin/dest outside SBC-MYS
    ]
    try:
        with open(file, 'r') as f:
            trains = json.load(f)
        logger.info(f"Loaded {len(trains)} trains")
        return trains
    except FileNotFoundError:
        logger.warning("Using placeholder SBC-MYS samples")
        return sample

def parse_geojson(file='data/geojson/sbc_mys.geojson'):
    sample = {
        'tracks': [1,2],
        'junctions': [{'name': 'Kengeri', 'km': 15}, {'name': 'Mandya', 'km': 90}],
        'stations': {'SBC': 10, 'MYS': 6, 'Kengeri': 4}  # Platforms from SR data
    }
    try:
        with open(file, 'r') as f:
            geo = json.load(f)
            tracks = list(set(f['properties'].get('track', 1) for f in geo['features']))
            junctions = [{'name': f['properties'].get('junction', 'Unknown'), 'km': f['properties'].get('km', 0)} for f in geo['features'] if 'junction' in f['properties']]
            stations = {f['properties'].get('junction'): f['properties'].get('platforms', 4) for f in geo['features'] if 'platforms' in f['properties']}
            logger.info(f"Parsed {len(tracks)} tracks, {len(junctions)} junctions, {len(stations)} stations for SBC-MYS")
            return {'tracks': tracks or [1,2], 'junctions': junctions, 'stations': stations}
    except FileNotFoundError:
        logger.warning("Using placeholder SBC-MYS geo")
        return sample
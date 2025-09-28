"""
Test suite for simulation functionality
Tests train position updates, real-time tracking, and simulation engine
"""

import pytest
import json
import time
from unittest.mock import Mock, patch, MagicMock
import sys
import os
from datetime import datetime, timedelta

# Add backend directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from simulator import TrainSimulator, SimulationEngine, PositionTracker

class TestTrainSimulator:
    """Test individual train simulation functionality"""
    
    def setup_method(self):
        """Set up test data before each test"""
        self.sample_train = {
            "id": "12622",
            "name": "Chennai Mail",
            "currentLocation": {"lat": 12.9051, "lon": 79.0747},
            "schedule": {
                "departure": "14:30",
                "arrival": "22:15",
                "nextStation": "Katpadi Jn",
                "eta": "15:45"
            },
            "speed": 85,
            "status": "on_time"
        }
        
        self.route_points = [
            {"lat": 12.9051, "lon": 79.0747, "station": "Arakkonam Jn"},
            {"lat": 12.9698, "lon": 79.1325, "station": "Katpadi Jn"},
            {"lat": 11.9416, "lon": 79.8083, "station": "Jolarpettai Jn"}
        ]
        
    def test_simulator_initialization(self):
        """Test that train simulator initializes correctly"""
        simulator = TrainSimulator(self.sample_train, self.route_points)
        
        assert simulator is not None
        assert simulator.train_id == "12622"
        assert simulator.current_position is not None
        assert len(simulator.route) == 3
        
    def test_position_update(self):
        """Test position update based on speed and time"""
        simulator = TrainSimulator(self.sample_train, self.route_points)
        initial_position = simulator.get_current_position()
        
        # Simulate 1 minute of movement
        simulator.update_position(1)  # 1 minute
        updated_position = simulator.get_current_position()
        
        # Position should have changed
        assert (initial_position['lat'] != updated_position['lat'] or 
                initial_position['lon'] != updated_position['lon'])
        
    def test_speed_change_handling(self):
        """Test handling of speed changes during simulation"""
        simulator = TrainSimulator(self.sample_train, self.route_points)
        
        # Change speed
        simulator.set_speed(60)
        assert simulator.current_speed == 60
        
        # Test speed restrictions
        simulator.apply_speed_restriction(45)
        assert simulator.current_speed == 45
        
    def test_station_arrival_detection(self):
        """Test detection of station arrivals"""
        simulator = TrainSimulator(self.sample_train, self.route_points)
        
        # Move train close to next station
        simulator.move_to_station("Katpadi Jn")
        
        # Should detect arrival
        assert simulator.is_at_station("Katpadi Jn")
        
    def test_eta_calculation(self):
        """Test ETA calculation based on current position and speed"""
        simulator = TrainSimulator(self.sample_train, self.route_points)
        
        eta = simulator.calculate_eta("Jolarpettai Jn")
        
        assert eta is not None
        assert isinstance(eta, str)  # Should return time string
        
    def test_delay_simulation(self):
        """Test simulation of delays and their impact"""
        simulator = TrainSimulator(self.sample_train, self.route_points)
        
        # Apply delay
        simulator.apply_delay(10)  # 10 minutes
        
        assert simulator.get_delay() == 10
        assert simulator.status == "delayed"

class TestSimulationEngine:
    """Test the main simulation engine"""
    
    def setup_method(self):
        """Set up simulation engine with test data"""
        with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'trains.json'), 'r') as f:
            self.test_data = json.load(f)
            
        self.trains = self.test_data['trains'][:3]  # Use first 3 trains
        
    def test_engine_initialization(self):
        """Test simulation engine initialization"""
        engine = SimulationEngine(self.trains)
        
        assert engine is not None
        assert len(engine.active_trains) == 3
        assert engine.simulation_time is not None
        
    def test_24_minute_simulation_cycle(self):
        """Test the 24-minute simulation cycle"""
        engine = SimulationEngine(self.trains)
        
        start_time = time.time()
        
        # Run one cycle (should represent 24 minutes)
        engine.run_cycle()
        
        end_time = time.time()
        
        # Should complete quickly (not actually 24 minutes)
        assert (end_time - start_time) < 5  # Less than 5 seconds
        
        # All trains should have updated positions
        for train_id in engine.active_trains:
            train = engine.get_train(train_id)
            assert train is not None
            
    def test_real_time_updates(self):
        """Test real-time position updates"""
        engine = SimulationEngine(self.trains)
        
        # Get initial positions
        initial_positions = {}
        for train_id in engine.active_trains:
            train = engine.get_train(train_id)
            initial_positions[train_id] = train.get_current_position()
            
        # Run simulation for a short time
        engine.run_for_minutes(2)
        
        # Positions should have changed
        for train_id in engine.active_trains:
            train = engine.get_train(train_id)
            current_position = train.get_current_position()
            initial_position = initial_positions[train_id]
            
            # At least one coordinate should have changed
            assert (current_position['lat'] != initial_position['lat'] or
                    current_position['lon'] != initial_position['lon'])
                    
    def test_conflict_detection_during_simulation(self):
        """Test conflict detection during active simulation"""
        # Create scenario with potential conflicts
        conflicting_trains = [
            {
                "id": "T1",
                "currentLocation": {"lat": 12.9, "lon": 79.0},
                "speed": 80,
                "assignedTrack": "track_1"
            },
            {
                "id": "T2", 
                "currentLocation": {"lat": 12.91, "lon": 79.01},
                "speed": 85,
                "assignedTrack": "track_1"
            }
        ]
        
        engine = SimulationEngine(conflicting_trains)
        conflicts = engine.detect_conflicts()
        
        # Should detect potential conflict (same track, close proximity)
        assert len(conflicts) > 0
        
    def test_emergency_stop_simulation(self):
        """Test emergency stop functionality"""
        engine = SimulationEngine(self.trains)
        
        # Trigger emergency stop for a train
        engine.emergency_stop("12622")
        
        train = engine.get_train("12622")
        assert train.current_speed == 0
        assert train.status == "emergency_stop"
        
    def test_rerouting_during_simulation(self):
        """Test dynamic rerouting during active simulation"""
        engine = SimulationEngine(self.trains)
        
        # Apply rerouting
        new_route = [
            {"lat": 12.9051, "lon": 79.0747, "station": "Arakkonam Jn"},
            {"lat": 11.9416, "lon": 79.8083, "station": "Jolarpettai Jn"}  # Skip Katpadi
        ]
        
        engine.reroute_train("12622", new_route)
        
        train = engine.get_train("12622")
        assert len(train.route) == 2  # Should have new route
        assert train.status == "rerouted"

class TestPositionTracker:
    """Test position tracking and GPS simulation"""
    
    def test_gps_coordinate_calculation(self):
        """Test GPS coordinate calculation along route"""
        start_point = {"lat": 12.9051, "lon": 79.0747}
        end_point = {"lat": 12.9698, "lon": 79.1325}
        
        tracker = PositionTracker()
        
        # Calculate position at 50% of route
        mid_position = tracker.interpolate_position(start_point, end_point, 0.5)
        
        assert mid_position is not None
        assert 'lat' in mid_position and 'lon' in mid_position
        
        # Should be between start and end points
        assert start_point['lat'] <= mid_position['lat'] <= end_point['lat']
        assert start_point['lon'] <= mid_position['lon'] <= end_point['lon']
        
    def test_distance_calculation(self):
        """Test distance calculation between coordinates"""
        point1 = {"lat": 12.9051, "lon": 79.0747}
        point2 = {"lat": 12.9698, "lon": 79.1325}
        
        tracker = PositionTracker()
        distance = tracker.calculate_distance(point1, point2)
        
        assert distance > 0
        assert isinstance(distance, float)
        
    def test_bearing_calculation(self):
        """Test bearing calculation between points"""
        point1 = {"lat": 12.9051, "lon": 79.0747}
        point2 = {"lat": 12.9698, "lon": 79.1325}
        
        tracker = PositionTracker()
        bearing = tracker.calculate_bearing(point1, point2)
        
        assert 0 <= bearing <= 360
        
    def test_route_progression_tracking(self):
        """Test tracking progression along a route"""
        route = [
            {"lat": 12.9051, "lon": 79.0747, "station": "Arakkonam Jn"},
            {"lat": 12.9698, "lon": 79.1325, "station": "Katpadi Jn"},
            {"lat": 11.9416, "lon": 79.8083, "station": "Jolarpettai Jn"}
        ]
        
        tracker = PositionTracker()
        current_position = {"lat": 12.95, "lon": 79.1}
        
        progress = tracker.calculate_route_progress(current_position, route)
        
        assert 0 <= progress <= 1
        
    def test_next_station_detection(self):
        """Test detection of next station along route"""
        route = [
            {"lat": 12.9051, "lon": 79.0747, "station": "Arakkonam Jn"},
            {"lat": 12.9698, "lon": 79.1325, "station": "Katpadi Jn"},
            {"lat": 11.9416, "lon": 79.8083, "station": "Jolarpettai Jn"}
        ]
        
        tracker = PositionTracker()
        current_position = {"lat": 12.93, "lon": 79.1}  # Between first two stations
        
        next_station = tracker.get_next_station(current_position, route)
        
        assert next_station is not None
        assert next_station['station'] == "Katpadi Jn"

# Performance Tests
class TestSimulationPerformance:
    """Test simulation performance with multiple trains"""
    
    def test_multiple_train_performance(self):
        """Test performance with many simultaneous trains"""
        # Create 10 trains for performance testing
        trains = []
        for i in range(10):
            trains.append({
                "id": f"T{i:03d}",
                "currentLocation": {"lat": 12.9 + i*0.01, "lon": 79.0 + i*0.01},
                "speed": 80 + i*5,
                "status": "on_time"
            })
            
        start_time = time.time()
        
        engine = SimulationEngine(trains)
        engine.run_cycle()
        
        end_time = time.time()
        
        # Should handle 10 trains efficiently
        assert (end_time - start_time) < 2  # Less than 2 seconds
        assert len(engine.active_trains) == 10
        
    def test_memory_usage(self):
        """Test memory efficiency during long simulation"""
        engine = SimulationEngine([self.sample_train] * 5)
        
        # Run multiple cycles
        for _ in range(10):
            engine.run_cycle()
            
        # Should not accumulate excessive data
        assert len(engine.simulation_history) <= 100  # Reasonable history limit

# Integration Tests
class TestSimulationIntegration:
    """Test integration with other system components"""
    
    def test_optimizer_integration(self):
        """Test integration with optimization system"""
        # This would test the interaction between simulator and optimizer
        # when rerouting decisions are made
        pass
        
    def test_api_integration(self):
        """Test integration with Flask API endpoints"""
        # This would test the API endpoints that serve simulation data
        pass

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
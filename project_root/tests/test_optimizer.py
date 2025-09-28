"""
Test suite for MILP optimizer functionality
Tests track assignment, conflict resolution, and optimization algorithms
"""

import pytest
import json
from unittest.mock import Mock, patch
import sys
import os

# Add backend directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from optimizer import TrackOptimizer, TrackAssignment, ConflictResolver

class TestTrackOptimizer:
    """Test the main MILP optimization functionality"""
    
    def setup_method(self):
        """Set up test data before each test"""
        self.sample_trains = [
            {
                "id": "12622",
                "name": "Chennai Mail",
                "priority": "high",
                "route": "MAS-CBE",
                "departure": "14:30",
                "arrival": "22:15"
            },
            {
                "id": "12624", 
                "name": "Chennai Express",
                "priority": "medium",
                "route": "MAS-MDU",
                "departure": "15:00",
                "arrival": "21:30"
            }
        ]
        
        self.sample_tracks = [
            {"id": "track_1", "capacity": 1, "status": "operational"},
            {"id": "track_2", "capacity": 1, "status": "operational"},
            {"id": "track_3", "capacity": 1, "status": "maintenance"}
        ]
        
    def test_optimizer_initialization(self):
        """Test that optimizer initializes correctly"""
        optimizer = TrackOptimizer(self.sample_trains, self.sample_tracks)
        assert optimizer is not None
        assert len(optimizer.trains) == 2
        assert len(optimizer.tracks) == 3
        
    def test_basic_assignment(self):
        """Test basic track assignment without conflicts"""
        optimizer = TrackOptimizer(self.sample_trains, self.sample_tracks)
        assignments = optimizer.optimize()
        
        # Should assign both trains to available tracks
        assert len(assignments) == 2
        assert all(assignment.track_id in ["track_1", "track_2"] for assignment in assignments)
        
    def test_priority_based_assignment(self):
        """Test that high priority trains get preferred assignments"""
        # Add more trains than available tracks
        extra_trains = self.sample_trains + [
            {
                "id": "12626",
                "name": "Kerala Express", 
                "priority": "low",
                "route": "MAS-TVC",
                "departure": "15:15",
                "arrival": "06:30"
            }
        ]
        
        optimizer = TrackOptimizer(extra_trains, self.sample_tracks[:2])  # Only 2 operational tracks
        assignments = optimizer.optimize()
        
        # High priority train should get assignment
        high_priority_assigned = any(
            assignment.train_id == "12622" for assignment in assignments
        )
        assert high_priority_assigned
        
    def test_maintenance_track_exclusion(self):
        """Test that tracks under maintenance are excluded"""
        optimizer = TrackOptimizer(self.sample_trains, self.sample_tracks)
        assignments = optimizer.optimize()
        
        # No assignments should be made to track_3 (maintenance)
        maintenance_assignments = [
            assignment for assignment in assignments 
            if assignment.track_id == "track_3"
        ]
        assert len(maintenance_assignments) == 0
        
    def test_conflict_detection(self):
        """Test detection of potential conflicts"""
        # Create overlapping time schedules
        conflicting_trains = [
            {
                "id": "T1",
                "departure": "14:30",
                "arrival": "15:30",
                "route": "A-B"
            },
            {
                "id": "T2", 
                "departure": "15:00",
                "arrival": "16:00",
                "route": "A-B"
            }
        ]
        
        resolver = ConflictResolver(conflicting_trains, self.sample_tracks[:1])  # Only 1 track
        conflicts = resolver.detect_conflicts()
        
        assert len(conflicts) > 0
        
    def test_rerouting_algorithm(self):
        """Test automatic rerouting when conflicts occur"""
        resolver = ConflictResolver(self.sample_trains, self.sample_tracks)
        rerouting_plan = resolver.resolve_conflicts()
        
        assert rerouting_plan is not None
        assert 'original_assignments' in rerouting_plan
        assert 'rerouted_assignments' in rerouting_plan
        
    def test_optimization_with_constraints(self):
        """Test optimization with various constraints"""
        # Add speed and capacity constraints
        constrained_tracks = [
            {"id": "track_1", "capacity": 1, "max_speed": 120, "status": "operational"},
            {"id": "track_2", "capacity": 2, "max_speed": 80, "status": "operational"}
        ]
        
        optimizer = TrackOptimizer(self.sample_trains, constrained_tracks)
        assignments = optimizer.optimize()
        
        # Should respect capacity constraints
        track_usage = {}
        for assignment in assignments:
            track_usage[assignment.track_id] = track_usage.get(assignment.track_id, 0) + 1
            
        for track_id, usage in track_usage.items():
            track_capacity = next(t["capacity"] for t in constrained_tracks if t["id"] == track_id)
            assert usage <= track_capacity

class TestTrackAssignment:
    """Test the TrackAssignment data structure"""
    
    def test_assignment_creation(self):
        """Test creating a track assignment"""
        assignment = TrackAssignment("T123", "track_1", "14:30", "16:45")
        
        assert assignment.train_id == "T123"
        assert assignment.track_id == "track_1"
        assert assignment.start_time == "14:30"
        assert assignment.end_time == "16:45"
        
    def test_assignment_validation(self):
        """Test assignment validation"""
        assignment = TrackAssignment("T123", "track_1", "14:30", "16:45")
        
        assert assignment.is_valid()
        
        # Test invalid assignment (end before start)
        invalid_assignment = TrackAssignment("T123", "track_1", "16:45", "14:30")
        assert not invalid_assignment.is_valid()
        
    def test_time_overlap_detection(self):
        """Test detecting time overlaps between assignments"""
        assignment1 = TrackAssignment("T1", "track_1", "14:30", "15:30")
        assignment2 = TrackAssignment("T2", "track_1", "15:00", "16:00")
        assignment3 = TrackAssignment("T3", "track_1", "16:30", "17:30")
        
        # Should detect overlap between assignment1 and assignment2
        assert assignment1.overlaps_with(assignment2)
        assert assignment2.overlaps_with(assignment1)
        
        # Should not detect overlap between assignment1 and assignment3
        assert not assignment1.overlaps_with(assignment3)

class TestOptimizationMetrics:
    """Test calculation of optimization metrics and KPIs"""
    
    def test_efficiency_calculation(self):
        """Test calculation of system efficiency metrics"""
        assignments = [
            TrackAssignment("T1", "track_1", "14:30", "15:30"),
            TrackAssignment("T2", "track_2", "15:00", "16:00")
        ]
        
        optimizer = TrackOptimizer([], [])
        metrics = optimizer.calculate_metrics(assignments)
        
        assert 'efficiency' in metrics
        assert 'utilization' in metrics
        assert 'conflicts' in metrics
        
    def test_delay_impact_analysis(self):
        """Test analysis of delay impact from rerouting"""
        original_schedule = {"T1": "15:30", "T2": "16:00"}
        rerouted_schedule = {"T1": "15:45", "T2": "16:00"}
        
        optimizer = TrackOptimizer([], [])
        delay_impact = optimizer.analyze_delay_impact(original_schedule, rerouted_schedule)
        
        assert delay_impact['total_delay'] == 15  # minutes
        assert delay_impact['affected_trains'] == 1

# Integration Tests
class TestSystemIntegration:
    """Test integration between different components"""
    
    def test_end_to_end_optimization(self):
        """Test complete optimization pipeline"""
        # Load sample data
        with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'trains.json'), 'r') as f:
            data = json.load(f)
            
        trains = data['trains'][:3]  # Use first 3 trains for testing
        tracks = [
            {"id": "track_1", "capacity": 1, "status": "operational"},
            {"id": "track_2", "capacity": 1, "status": "operational"}
        ]
        
        # Run optimization
        optimizer = TrackOptimizer(trains, tracks)
        assignments = optimizer.optimize()
        
        # Validate results
        assert len(assignments) <= len(tracks)
        assert all(assignment.is_valid() for assignment in assignments)
        
    def test_conflict_resolution_integration(self):
        """Test integration with conflict resolution system"""
        # Create scenario with guaranteed conflicts
        trains = [
            {"id": "T1", "departure": "15:00", "arrival": "16:00", "priority": "high"},
            {"id": "T2", "departure": "15:30", "arrival": "16:30", "priority": "medium"},
            {"id": "T3", "departure": "15:45", "arrival": "17:00", "priority": "low"}
        ]
        
        tracks = [{"id": "track_1", "capacity": 1, "status": "operational"}]
        
        optimizer = TrackOptimizer(trains, tracks)
        resolver = ConflictResolver(trains, tracks)
        
        # Should detect conflicts
        conflicts = resolver.detect_conflicts()
        assert len(conflicts) > 0
        
        # Should provide resolution
        resolution = resolver.resolve_conflicts()
        assert resolution is not None

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
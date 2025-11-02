"""
Timeline Calculator Module
Calculates immigration timelines and deadlines for F-1 students.

This module provides:
- OPT application window calculations
- Grace period tracking
- Status determination
- Personalized action items
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional


class TimelineCalculator:
    """
    Calculate immigration timelines for F-1 students.
    
    Handles:
    - OPT application windows (90 days before graduation)
    - Grace periods (60 days after graduation)
    - Recommended deadlines with safety buffers
    - Status-based action items
    """
    
    # Constants
    OPT_WINDOW_DAYS = 90  # Can apply 90 days before program end
    GRACE_PERIOD_DAYS = 60  # 60 days after program end
    RECOMMENDED_BUFFER_DAYS = 30  # Apply at least 30 days before deadline
    PREPARATION_DAYS = 120  # Start preparing 120 days before window opens
    
    @classmethod
    def calculate_opt_timeline(cls, program_end_date: str, current_status: str = 'planning_opt') -> Dict:
        """
        Calculate OPT timeline based on program end date.
        
        Args:
            program_end_date: Program end date in YYYY-MM-DD format
            current_status: User's F-1 status (currently_studying, planning_opt, etc.)
        
        Returns:
            Dict containing:
                - program_end_date: Input date
                - opt_window_opens: Date when OPT window opens
                - recommended_apply_by: Recommended application deadline (with buffer)
                - last_day_to_apply: Absolute deadline
                - grace_period_ends: End of grace period
                - days_until_window: Days until window opens (negative if passed)
                - days_until_deadline: Days until deadline (negative if passed)
                - status: Current timeline status
                - urgency: urgency level (none, low, medium, high, critical)
                - action_items: List of recommended actions
                - warnings: List of important warnings (if any)
        
        Example:
            >>> calc = TimelineCalculator()
            >>> timeline = calc.calculate_opt_timeline('2025-12-15', 'planning_opt')
            >>> print(timeline['status'])  # 'in_window', 'before_window', etc.
        """
        
        try:
            end_date = datetime.fromisoformat(program_end_date)
        except (ValueError, TypeError):
            return {
                'error': 'Invalid program end date format. Must be YYYY-MM-DD.',
                'status': 'error'
            }
        
        today = datetime.now()
        
        # Calculate key dates
        opt_window_start = end_date - timedelta(days=cls.OPT_WINDOW_DAYS)
        recommended_apply_by = end_date - timedelta(days=cls.RECOMMENDED_BUFFER_DAYS)
        grace_period_end = end_date + timedelta(days=cls.GRACE_PERIOD_DAYS)
        preparation_start = opt_window_start - timedelta(days=cls.PREPARATION_DAYS)
        
        # Calculate days remaining
        days_until_window = (opt_window_start - today).days
        days_until_deadline = (end_date - today).days
        days_until_grace_end = (grace_period_end - today).days
        
        # Determine status
        status_info = cls._determine_status(
            today, 
            opt_window_start, 
            end_date, 
            grace_period_end
        )
        
        # Build timeline object
        timeline = {
            'program_end_date': program_end_date,
            'opt_window_opens': opt_window_start.strftime('%Y-%m-%d'),
            'recommended_apply_by': recommended_apply_by.strftime('%Y-%m-%d'),
            'last_day_to_apply': program_end_date,
            'grace_period_ends': grace_period_end.strftime('%Y-%m-%d'),
            'days_until_window': days_until_window,
            'days_until_deadline': days_until_deadline,
            'days_until_grace_end': days_until_grace_end,
            'status': status_info['status'],
            'urgency': status_info['urgency'],
            'status_message': status_info['message']
        }
        
        # Add action items and warnings
        timeline['action_items'] = cls._get_action_items(timeline)
        timeline['warnings'] = cls._get_warnings(timeline)
        
        return timeline
    
    @classmethod
    def _determine_status(cls, today: datetime, window_start: datetime, 
                         end_date: datetime, grace_end: datetime) -> Dict:
        """
        Determine current OPT timeline status.
        
        Args:
            today: Current date
            window_start: OPT window open date
            end_date: Program end date
            grace_end: Grace period end date
        
        Returns:
            Dict with status, urgency, and message
        """
        
        if today < window_start:
            days_until = (window_start - today).days
            
            if days_until > 120:
                return {
                    'status': 'far_before_window',
                    'urgency': 'none',
                    'message': 'Your OPT window is not open yet. Start preparing soon.'
                }
            else:
                return {
                    'status': 'before_window',
                    'urgency': 'low',
                    'message': f'Your OPT window opens in {days_until} days. Time to prepare!'
                }
        
        elif window_start <= today <= end_date:
            days_remaining = (end_date - today).days
            
            if days_remaining <= 7:
                return {
                    'status': 'in_window_critical',
                    'urgency': 'critical',
                    'message': f'⚠️ URGENT: Only {days_remaining} days left to apply!'
                }
            elif days_remaining <= 30:
                return {
                    'status': 'in_window_urgent',
                    'urgency': 'high',
                    'message': f'Application deadline approaching: {days_remaining} days remaining'
                }
            else:
                return {
                    'status': 'in_window',
                    'urgency': 'medium',
                    'message': f'Your OPT window is open. {days_remaining} days to apply.'
                }
        
        elif end_date < today <= grace_end:
            days_remaining = (grace_end - today).days
            
            return {
                'status': 'grace_period',
                'urgency': 'high',
                'message': f'You are in the 60-day grace period. {days_remaining} days remaining.'
            }
        
        else:  # today > grace_end
            return {
                'status': 'expired',
                'urgency': 'critical',
                'message': 'Grace period has ended. Immediate action required.'
            }
    
    @classmethod
    def _get_action_items(cls, timeline: Dict) -> List[str]:
        """
        Get recommended action items based on timeline status.
        
        Args:
            timeline: Timeline dict with status and dates
        
        Returns:
            List of actionable items
        """
        
        status = timeline['status']
        days_until_window = timeline['days_until_window']
        days_until_deadline = timeline['days_until_deadline']
        
        # Far before window (> 120 days)
        if status == 'far_before_window':
            return [
                'Review OPT eligibility requirements',
                'Start saving for $410 USCIS filing fee',
                'Familiarize yourself with I-765 form',
                'Keep your passport valid (6+ months)',
                f'OPT window opens in {days_until_window} days'
            ]
        
        # Before window (30-120 days)
        elif status == 'before_window':
            return [
                'Gather required documents (passport, I-20, transcripts)',
                'Get passport photos taken (2" x 2", recent)',
                'Download and review I-765 form',
                'Prepare filing fee ($410 check or money order)',
                'Schedule meeting with DSO for signature',
                f'Window opens on {timeline["opt_window_opens"]}'
            ]
        
        # In window - comfortable time
        elif status == 'in_window':
            return [
                'Complete I-765 application form',
                'Get DSO signature on I-20 (page 3)',
                'Make copies of all documents (2 sets)',
                'Get check/money order for $410',
                'Review USCIS mailing address',
                f'Recommended to apply by {timeline["recommended_apply_by"]}',
                f'{days_until_deadline} days remaining'
            ]
        
        # In window - urgent (< 30 days)
        elif status == 'in_window_urgent':
            return [
                '⚠️ URGENT: Apply as soon as possible',
                'Complete I-765 form TODAY',
                'Get DSO signature IMMEDIATELY',
                'Prepare all documents and copies',
                'Use certified mail with tracking',
                f'Deadline: {timeline["last_day_to_apply"]} ({days_until_deadline} days)'
            ]
        
        # In window - critical (< 7 days)
        elif status == 'in_window_critical':
            return [
                '🚨 CRITICAL: Apply IMMEDIATELY - express processing recommended',
                'Complete I-765 RIGHT NOW',
                'Visit DSO TODAY for signature',
                'Use overnight/express mail',
                'Document everything with photos/receipts',
                f'FINAL DEADLINE: {timeline["last_day_to_apply"]}'
            ]
        
        # Grace period
        elif status == 'grace_period':
            return [
                '⚠️ You are in the 60-day grace period after graduation',
                'If you applied for OPT: Track application status online',
                'If you didn\'t apply: Consider other visa options (H-1B, transfer)',
                'Cannot work until EAD card is received',
                'Consult with DSO about your options',
                f'Grace period ends: {timeline["grace_period_ends"]}'
            ]
        
        # Expired
        elif status == 'expired':
            return [
                '❌ Grace period has ended',
                'You may be out of status',
                'Contact immigration attorney IMMEDIATELY',
                'Do NOT work without proper authorization',
                'Discuss options with DSO and lawyer'
            ]
        
        else:
            return ['Contact your DSO for guidance']
    
    @classmethod
    def _get_warnings(cls, timeline: Dict) -> List[Dict]:
        """
        Get important warnings based on timeline.
        
        Args:
            timeline: Timeline dict with status and dates
        
        Returns:
            List of warning dicts with severity and message
        """
        
        warnings = []
        
        # Critical warnings for urgent situations
        if timeline['urgency'] == 'critical':
            if timeline['status'] == 'in_window_critical':
                warnings.append({
                    'severity': 'critical',
                    'message': 'Less than 7 days to apply for OPT. Apply immediately to avoid missing the deadline.',
                    'action': 'Visit your DSO today'
                })
            
            elif timeline['status'] == 'expired':
                warnings.append({
                    'severity': 'critical',
                    'message': 'Grace period has ended. You may be out of status and need immediate legal advice.',
                    'action': 'Contact immigration attorney ASAP'
                })
        
        # High priority warnings
        elif timeline['urgency'] == 'high':
            if timeline['status'] == 'in_window_urgent':
                warnings.append({
                    'severity': 'high',
                    'message': 'Less than 30 days to apply. Start your application now to avoid issues.',
                    'action': 'Begin I-765 application immediately'
                })
            
            elif timeline['status'] == 'grace_period':
                warnings.append({
                    'severity': 'high',
                    'message': 'You are in your 60-day grace period. Cannot work without EAD card.',
                    'action': 'Track your OPT application status'
                })
        
        # General reminders
        if timeline['status'] in ['in_window', 'in_window_urgent', 'in_window_critical']:
            warnings.append({
                'severity': 'info',
                'message': 'USCIS processing typically takes 90-120 days. Apply early for peace of mind.',
                'action': None
            })
        
        return warnings
    
    @classmethod
    def get_human_readable_status(cls, timeline: Dict) -> str:
        """
        Get a human-readable status message for display.
        
        Args:
            timeline: Timeline dict
        
        Returns:
            Formatted status string
        """
        
        status = timeline['status']
        
        status_messages = {
            'far_before_window': '📅 Planning Phase',
            'before_window': '⏰ Preparation Phase',
            'in_window': '✅ Application Window Open',
            'in_window_urgent': '⚠️ Deadline Approaching',
            'in_window_critical': '🚨 URGENT - Apply Now',
            'grace_period': '⏳ Grace Period',
            'expired': '❌ Grace Period Ended'
        }
        
        return status_messages.get(status, 'Unknown Status')
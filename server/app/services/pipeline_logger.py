"""
GOHIP Platform - Pipeline Logger Service
=========================================

In-memory log store for real-time ETL pipeline monitoring.
Provides thread-safe logging for background task execution.

Phase 17: Live Operations Center with per-country tracking
"""

import threading
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum


class LogLevel(str, Enum):
    """Log severity levels."""
    INFO = "INFO"
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    ERROR = "ERROR"
    PHASE = "PHASE"


class CountryStatus(str, Enum):
    """Status for individual country processing."""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"


class PipelineLogger:
    """
    Thread-safe in-memory log manager for ETL pipeline monitoring.
    
    Phase 17: Enhanced with per-country tracking for Live Operations Center.
    
    Stores log entries that can be polled by the frontend for
    real-time progress display, including per-country status updates.
    """
    
    _instance: Optional["PipelineLogger"] = None
    _lock = threading.Lock()
    
    def __new__(cls) -> "PipelineLogger":
        """Singleton pattern for global log access."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._logs: List[str] = []
                    cls._instance._is_running = False
                    cls._instance._started_at: Optional[datetime] = None
                    cls._instance._finished_at: Optional[datetime] = None
                    cls._instance._stop_requested = False
                    # Phase 17: Per-country tracking
                    cls._instance._current_country: Optional[str] = None
                    cls._instance._total_countries: int = 0
                    cls._instance._completed_countries: List[str] = []
                    cls._instance._failed_countries: List[str] = []
                    cls._instance._country_data: Dict[str, Dict[str, Any]] = {}
        return cls._instance
    
    def request_stop(self) -> None:
        """Request the pipeline to stop after current country."""
        with self._lock:
            self._stop_requested = True
            self._logs.append(f"{datetime.utcnow().strftime('%H:%M:%S')} ⏹️ Stop requested by user")
    
    @property
    def stop_requested(self) -> bool:
        """Check if stop has been requested."""
        with self._lock:
            return self._stop_requested
    
    def clear_stop_request(self) -> None:
        """Clear the stop request flag."""
        with self._lock:
            self._stop_requested = False
    
    def clear(self) -> None:
        """Clear all logs and reset state for new pipeline run."""
        with self._lock:
            self._logs = []
            self._is_running = False
            self._started_at = None
            self._finished_at = None
            # Phase 17: Reset per-country tracking
            self._current_country = None
            self._total_countries = 0
            self._completed_countries = []
            self._failed_countries = []
            self._country_data = {}
    
    def start(self, total_countries: int = 50) -> None:
        """Mark pipeline as started."""
        with self._lock:
            self._logs = []
            self._is_running = True
            self._started_at = datetime.utcnow()
            self._finished_at = None
            self._stop_requested = False  # Clear any previous stop request
            # Phase 17: Initialize per-country tracking
            self._current_country = None
            self._total_countries = total_countries
            self._completed_countries = []
            self._failed_countries = []
            self._country_data = {}
        self.log("Pipeline Initialized", LogLevel.PHASE)
        self.log("━" * 50)
    
    def finish(self, success: bool = True) -> None:
        """Mark pipeline as finished."""
        with self._lock:
            self._is_running = False
            self._finished_at = datetime.utcnow()
            self._current_country = None
        
        if self._started_at:
            duration = (self._finished_at - self._started_at).total_seconds()
            self.log("━" * 50)
            if success:
                self.log(f"Pipeline Finished Successfully ({duration:.2f}s)", LogLevel.SUCCESS)
            else:
                self.log(f"Pipeline Completed with Errors ({duration:.2f}s)", LogLevel.ERROR)
    
    # =========================================================================
    # PHASE 17: PER-COUNTRY TRACKING METHODS
    # =========================================================================
    
    def start_country(self, iso_code: str) -> None:
        """Mark a country as currently being processed."""
        with self._lock:
            self._current_country = iso_code
            self._country_data[iso_code] = {
                "status": CountryStatus.PROCESSING.value,
                "started_at": datetime.utcnow().isoformat(),
                "metric": None,
                "error": None
            }
    
    def complete_country(self, iso_code: str, metric: Optional[float] = None) -> None:
        """Mark a country as successfully processed."""
        with self._lock:
            if iso_code not in self._completed_countries:
                self._completed_countries.append(iso_code)
            if iso_code in self._country_data:
                self._country_data[iso_code]["status"] = CountryStatus.SUCCESS.value
                self._country_data[iso_code]["finished_at"] = datetime.utcnow().isoformat()
                self._country_data[iso_code]["metric"] = metric
            else:
                self._country_data[iso_code] = {
                    "status": CountryStatus.SUCCESS.value,
                    "finished_at": datetime.utcnow().isoformat(),
                    "metric": metric,
                    "error": None
                }
            # Clear current country if it was this one
            if self._current_country == iso_code:
                self._current_country = None
    
    def fail_country(self, iso_code: str, error: str) -> None:
        """Mark a country as failed."""
        with self._lock:
            if iso_code not in self._failed_countries:
                self._failed_countries.append(iso_code)
            if iso_code in self._country_data:
                self._country_data[iso_code]["status"] = CountryStatus.FAILED.value
                self._country_data[iso_code]["finished_at"] = datetime.utcnow().isoformat()
                self._country_data[iso_code]["error"] = error
            else:
                self._country_data[iso_code] = {
                    "status": CountryStatus.FAILED.value,
                    "finished_at": datetime.utcnow().isoformat(),
                    "metric": None,
                    "error": error
                }
            # Clear current country if it was this one
            if self._current_country == iso_code:
                self._current_country = None
    
    def log(self, message: str, level: LogLevel = LogLevel.INFO) -> None:
        """
        Add a log entry with timestamp.
        
        Args:
            message: Log message text
            level: Log severity level
        """
        timestamp = datetime.utcnow().strftime("%H:%M:%S.%f")[:-3]
        
        # Format based on level
        if level == LogLevel.PHASE:
            formatted = f"[{timestamp}] ◆ {message}"
        elif level == LogLevel.SUCCESS:
            formatted = f"[{timestamp}] ✓ {message}"
        elif level == LogLevel.WARNING:
            formatted = f"[{timestamp}] ⚠ {message}"
        elif level == LogLevel.ERROR:
            formatted = f"[{timestamp}] ✗ {message}"
        else:
            formatted = f"[{timestamp}]   {message}"
        
        with self._lock:
            self._logs.append(formatted)
    
    def phase(self, phase_name: str) -> None:
        """Log a major phase transition."""
        self.log("")
        self.log(f"[PHASE] {phase_name}", LogLevel.PHASE)
        self.log("─" * 40)
    
    def success(self, message: str) -> None:
        """Log a success message."""
        self.log(message, LogLevel.SUCCESS)
    
    def warning(self, message: str) -> None:
        """Log a warning message."""
        self.log(message, LogLevel.WARNING)
    
    def error(self, message: str) -> None:
        """Log an error message."""
        self.log(message, LogLevel.ERROR)
    
    def get_logs(self) -> List[str]:
        """Get all current log entries."""
        with self._lock:
            return self._logs.copy()
    
    @property
    def is_running(self) -> bool:
        """Check if pipeline is currently running."""
        return self._is_running
    
    def get_status(self) -> dict:
        """Get current pipeline status (basic)."""
        with self._lock:
            return {
                "is_running": self._is_running,
                "started_at": self._started_at.isoformat() if self._started_at else None,
                "finished_at": self._finished_at.isoformat() if self._finished_at else None,
                "log_count": len(self._logs),
            }
    
    def get_detailed_status(self) -> dict:
        """
        Get detailed pipeline status for Live Operations Center.
        
        Phase 17: Enhanced status with per-country tracking.
        
        Returns:
            Dictionary containing:
            - current_country: ISO code of country being processed
            - progress: "X/Y" progress string
            - progress_count: Number of completed countries
            - total_countries: Total number of countries to process
            - completed_countries: List of successfully processed ISO codes
            - failed_countries: List of failed ISO codes
            - country_data: Dict mapping ISO codes to their status/metric/error
            - logs: Last 10 log entries for the ticker
            - is_running: Boolean pipeline status
            - started_at: Timestamp when pipeline started
            - finished_at: Timestamp when pipeline finished (if done)
        """
        with self._lock:
            completed_count = len(self._completed_countries) + len(self._failed_countries)
            return {
                "current_country": self._current_country,
                "progress": f"{completed_count}/{self._total_countries}",
                "progress_count": completed_count,
                "total_countries": self._total_countries,
                "completed_countries": self._completed_countries.copy(),
                "failed_countries": self._failed_countries.copy(),
                "country_data": self._country_data.copy(),
                "logs": self._logs[-100:] if self._logs else [],  # Last 100 logs for display
                "is_running": self._is_running,
                "started_at": self._started_at.isoformat() if self._started_at else None,
                "finished_at": self._finished_at.isoformat() if self._finished_at else None,
            }


# Global singleton instance
pipeline_logger = PipelineLogger()

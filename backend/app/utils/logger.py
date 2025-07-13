"""
Logging configuration using loguru
"""

from loguru import logger
import sys
from pathlib import Path
from app.config.settings import settings

def setup_logger():
    """Setup loguru logger with file and console output"""
    
    # Remove default logger
    logger.remove()
    
    # Create logs directory
    Path(settings.LOGS_DIR).mkdir(parents=True, exist_ok=True)
    
    # Console logger
    logger.add(
        sys.stdout,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True
    )
    
    # File logger
    logger.add(
        f"{settings.LOGS_DIR}/app.log",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="100 MB",
        retention="30 days",
        compression="zip"
    )
    
    # Error file logger
    logger.add(
        f"{settings.LOGS_DIR}/error.log",
        level="ERROR",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation="50 MB",
        retention="60 days",
        compression="zip"
    )
    
    return logger

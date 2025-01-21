import logging


class Logger:
    """
    Eine einfache Singleton-Klasse für das Logging in Python.

    Diese Klasse verwendet das `logging`-Modul von Python und stellt sicher, 
    dass nur eine Instanz des Loggers existiert.  Sie kann in Submodulen 
    importiert und verwendet werden, um Log-Nachrichten zu schreiben.
    """

    _instance = None

    DEBUG = logging.DEBUG
    INFO = logging.INFO
    WARNING = logging.WARNING
    ERROR = logging.ERROR
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(Logger, cls).__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self, log_file="app.log", log_level=logging.INFO):
        """
        Initialisiert den Logger.

        Args:
          log_file: Der Name der Log-Datei.
          log_level: Der Log-Level (z.B. logging.DEBUG, logging.INFO, logging.WARNING, logging.ERROR, logging.CRITICAL).
        """

        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(log_level)

        # Erstelle einen FileHandler und setze den Log-Level
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(log_level)

        # Erstelle einen Formatter für die Log-Nachrichten
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)

        # Füge den Handler zum Logger hinzu
        self.logger.addHandler(file_handler)

    def debug(self, message):
        """Schreibt eine Debug-Nachricht in das Log."""
        self.logger.debug(message)

    def info(self, message):
        """Schreibt eine Info-Nachricht in das Log."""
        self.logger.info(message)

    def warning(self, message):
        """Schreibt eine Warnung in das Log."""
        self.logger.warning(message)

    def error(self, message):
        """Schreibt eine Fehlermeldung in das Log."""
        self.logger.error(message)

    def critical(self, message):
        """Schreibt eine kritische Fehlermeldung in das Log."""
        self.logger.critical(message)

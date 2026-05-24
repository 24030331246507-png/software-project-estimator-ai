from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User  # noqa: E402,F401
from .project import ProjectAccess, ProjectPrediction  # noqa: E402,F401
from .contact import ContactQuery  # noqa: E402,F401

from sqlmodel import SQLModel, Field

class Login(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str
    password: str
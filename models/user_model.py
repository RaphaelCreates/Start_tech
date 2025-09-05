from sqlmodel import Field, SQLModel
    
class User(SQLModel, table=True):
    totvs_id: str = Field(unique=True, primary_key=True)
    name: str = Field(index=True)
    password: str



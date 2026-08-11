from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://z1:z1@db:5432/z1"
    openai_api_key: str = ""
    google_cloud_project: str = ""
    google_drive_folder_id: str = ""
    google_maps_api_key: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

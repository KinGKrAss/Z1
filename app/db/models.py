from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Property(Base):
    __tablename__ = "properties"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    object_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    address: Mapped["PropertyAddress | None"] = relationship(back_populates="property", uselist=False, cascade="all, delete-orphan")
    units: Mapped[list["Unit"]] = relationship(back_populates="property", cascade="all, delete-orphan")


class PropertyAddress(Base):
    __tablename__ = "property_addresses"
    id: Mapped[int] = mapped_column(primary_key=True)
    property_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), unique=True)
    street: Mapped[str | None] = mapped_column(String)
    house_number: Mapped[str | None] = mapped_column(String)
    postal_code: Mapped[str | None] = mapped_column(String)
    city: Mapped[str | None] = mapped_column(String)
    country: Mapped[str] = mapped_column(String, default="DE")
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    property: Mapped[Property] = relationship(back_populates="address")


class Unit(Base):
    __tablename__ = "units"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    property_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"))
    unit_code: Mapped[str | None] = mapped_column(String)
    area_m2: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String, default="active")
    property: Mapped[Property] = relationship(back_populates="units")


class MemoryEntry(Base):
    __tablename__ = "memory_entries"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    title: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    memory_type: Mapped[str] = mapped_column(String, default="fact", nullable=False)
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("1.0"))
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    sources: Mapped[list["SourceReference"]] = relationship(back_populates="memory", cascade="all, delete-orphan")


class SourceReference(Base):
    __tablename__ = "source_references"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    memory_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("memory_entries.id", ondelete="CASCADE"))
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    source_id: Mapped[str | None] = mapped_column(String)
    source_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    memory: Mapped[MemoryEntry] = relationship(back_populates="sources")


class PropertyDocument(Base):
    __tablename__ = "property_documents"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    property_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"))
    drive_file_id: Mapped[str | None] = mapped_column(String)
    name: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String)
    version: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Decision(Base):
    __tablename__ = "decisions"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    property_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL"))
    decision_type: Mapped[str] = mapped_column(String, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text)
    decided_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MaintenanceTicket(Base):
    __tablename__ = "maintenance_tickets"
    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    property_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="open")
    priority: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_log"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str | None] = mapped_column(String)
    entity_id: Mapped[str | None] = mapped_column(String)
    before_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    after_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

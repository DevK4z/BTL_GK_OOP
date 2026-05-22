from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Room(Base):
    __tablename__ = "rooms"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    devices = relationship("Device", back_populates="room")

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String) # "Light", "AC", "Lock"
    status = Column(Boolean, default=False)
    base_power = Column(Float, default=0.0)
    param = Column(Float, default=0.0) # Brightness for Light, Temp for AC
    is_online = Column(Boolean, default=True)
    room_id = Column(Integer, ForeignKey("rooms.id"))
    
    room = relationship("Room", back_populates="devices")

class DeviceLog(Base):
    __tablename__ = "device_logs"
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True)
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

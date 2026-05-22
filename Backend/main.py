from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database, models, websockets, engine_runner
from pydantic import BaseModel
import asyncio
from contextlib import asynccontextmanager

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Smart Home Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoomCreate(BaseModel):
    name: str

class DeviceCreate(BaseModel):
    device_id: str
    name: str
    type: str 
    base_power: float
    room_id: int
    param: float = 0.0

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websockets.manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()

    except WebSocketDisconnect:
        websockets.manager.disconnect(websocket)

@app.post("/rooms/")
def create_room(room: RoomCreate, db: Session = Depends(database.get_db)):
    db_room = models.Room(name=room.name)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

@app.get("/rooms/")
def get_rooms(db: Session = Depends(database.get_db)):
    return db.query(models.Room).all()

@app.post("/devices/")
def create_device(device: DeviceCreate, db: Session = Depends(database.get_db)):
    db_device = models.Device(**device.model_dump())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

@app.get("/devices/")
def get_devices(db: Session = Depends(database.get_db)):
    return db.query(models.Device).all()

@app.post("/devices/{device_id}/operate")
async def operate_device(device_id: str, db: Session = Depends(database.get_db)):
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    if not device.is_online:

        log = models.DeviceLog(device_id=device_id, action="CONNECTION EXCEPTION")
        db.add(log)
        db.commit()
        await websockets.manager.broadcast({
            "event": "CONNECTION_ERROR",
            "device_id": device_id,
            "message": f"ConnectionException: Thiet bi '{device.name}' mat ket noi!"
        })
        raise HTTPException(status_code=503, detail="Device is offline")

    device.status = not device.status
    action_str = "TURN_ON" if device.status else "TURN_OFF"

    log = models.DeviceLog(device_id=device_id, action=action_str)
    db.add(log)
    db.commit()

    await websockets.manager.broadcast({
        "event": "STATE_CHANGE",
        "device_id": device_id,
        "status": device.status
    })

    return {"status": "success", "device_id": device_id, "new_state": device.status}

@app.post("/devices/{device_id}/simulate-disconnect")
async def simulate_disconnect(device_id: str, db: Session = Depends(database.get_db)):
    device = db.query(models.Device).filter(models.Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_online = not device.is_online 
    db.commit()
    await websockets.manager.broadcast({
        "event": "DEVICE_OFFLINE" if not device.is_online else "DEVICE_ONLINE",
        "device_id": device_id
    })
    return {"message": "Simulated connection toggle", "is_online": device.is_online}

@app.get("/system/power")
def get_total_power(db: Session = Depends(database.get_db)):
    devices = db.query(models.Device).all()

    result = engine_runner.run_power_calculation(devices)
    return result

@app.get("/routing/vacuum")
def calculate_vacuum_route(start: str, end: str):

    result = engine_runner.run_route(start, end)
    return result

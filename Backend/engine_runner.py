import subprocess
import json
import os

# C++ engine is compiled in the parent directory
ENGINE_PATH = os.path.join(os.path.dirname(__file__), "..", "engine")

def run_route(start_node: str, end_node: str):
    """Gọi C++ Engine để chạy thuật toán Dijkstra."""
    result = subprocess.run(
        [ENGINE_PATH, "--action", "route", "--start", start_node, "--end", end_node],
        capture_output=True,
        text=True
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"error": "Lỗi parse JSON từ C++ Engine", "raw_output": result.stdout}

def run_power_calculation(devices: list):
    """Gọi C++ Engine để tính tổng điện năng."""
    # format: Type,BasePower,Status,Param;...
    devices_str = ";".join([f"{d.type},{d.base_power},{int(d.status)},{d.param}" for d in devices])
    result = subprocess.run(
        [ENGINE_PATH, "--action", "power", "--devices", devices_str],
        capture_output=True,
        text=True
    )
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"error": "Lỗi parse JSON từ C++ Engine", "raw_output": result.stdout}

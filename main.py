import datetime
import math
from abc import ABC, abstractmethod

class Logger:
    @staticmethod
    def get_timestamp() -> str:
        return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def log(message: str) -> None:
        with open("home_data.txt", "a", encoding="utf-8") as file:
            file.write(f"[LOG {Logger.get_timestamp()}] {message}\n")

    @staticmethod
    def log_error(message: str) -> None:
        with open("home_data.txt", "a", encoding="utf-8") as file:
            file.write(f"[ERROR {Logger.get_timestamp()}] {message}\n")

    @staticmethod
    def clear_log() -> None:
        with open("home_data.txt", "w", encoding="utf-8") as file:
            pass

    @staticmethod
    def write(filename: str, content: str) -> None:
        with open(filename, "a", encoding="utf-8") as file:
            file.write(content)

class ConnectionException(Exception):
    def __init__(self, device_name: str):
        self.message = f"ConnectionException: Thiet bi '{device_name}' mat ket noi!"
        super().__init__(self.message)

    def __str__(self):
        return self.message


class Device(ABC):
    def __init__(self, device_id: str = "", name: str = "", power: float = 0.0):
        self.id = device_id
        self.name = name
        self.status = False
        self.power = power
        self.onl = True

    def check_connection(self):
        if not self.onl:
            raise ConnectionException(self.name)

    @abstractmethod
    def get_power_const(self) -> float:
        pass

    @abstractmethod
    def operate(self):
        pass

    @abstractmethod
    def get_power_consumption(self) -> float:
        pass

    @abstractmethod
    def get_in4(self) -> str:
        pass

    def get_info(self) -> str:
        return self.get_in4()

    def __add__(self, other: 'Device') -> float:
        return self.get_power_const() + other.get_power_const()

    def get_id(self) -> str: return self.id
    def get_name(self) -> str: return self.name
    def get_status(self) -> bool: return self.status
    def get_power(self) -> float: return self.power
    def get_onl(self) -> bool: return self.onl
    def get_is_online(self) -> bool: return self.get_onl()

    def set_id(self, device_id: str): self.id = device_id
    def set_name(self, name: str): self.name = name
    def set_status(self, status: bool): self.status = status
    def set_power(self, power: float): self.power = power
    def set_onl(self, onl: bool): self.onl = onl
    def set_online(self, onl: bool): self.set_onl(onl)

    def turn_on(self): self.status = True
    def turn_off(self): self.status = False


class SmartLight(Device):
    def __init__(self, device_id: str = "", name: str = "", power: float = 0.0, bright: int = 100, color: str = "White"):
        super().__init__(device_id, name, power)
        self.bright = bright
        self.color = color

    def get_bright(self) -> int: return self.bright
    def get_brightness(self) -> int: return self.bright
    def get_color(self) -> str: return self.color

    def set_bright(self, b: int):
        self.bright = max(0, min(100, b))
        
    def set_brightness(self, b: int): self.set_bright(b)
    def set_color(self, c: str): self.color = c

    def operate(self):
        self.check_connection()
        self.status = not self.status
        action = "BAT" if self.status else "TAT"
        msg = f"[SmartLight] {self.name} -> {action} | Brightness: {self.bright}% | Color: {self.color}"
        print(f"  {msg}")
        Logger.log(msg)

    def get_power_consumption(self) -> float:
        if not self.status: return 0.0
        return self.power * (self.bright / 100.0)

    def get_in4(self) -> str:
        current_power = self.power * (self.bright / 100.0) if self.status else 0.0
        return f"SmartLight [{self.id}] {self.name} | Status: {'ON' if self.status else 'OFF'} | Brightness: {self.bright}% | Color: {self.color} | Power: {current_power:.1f}W"

    def get_power_const(self) -> float:
        if not self.status: return 0.0
        return self.power * (self.bright / 100.0)


class SmartAC(Device):
    def __init__(self, device_id: str = "", name: str = "", power: float = 0.0, temperature: float = 25.0):
        super().__init__(device_id, name, power)
        self.t = temperature

    def get_temperature(self) -> float: return self.t
    def set_temperature(self, temp: float): self.t = temp

    def operate(self):
        self.check_connection()
        self.status = not self.status
        action = "BAT" if self.status else "TAT"
        msg = f"[SmartAC] {self.name} -> {action} | Temp: {self.t:.1f}C"
        print(f"  {msg}")
        Logger.log(msg)

    def get_power_consumption(self) -> float:
        if not self.status: return 0.0
        return self.power * (1.0 + abs(self.t - 25.0) * 0.05)

    def get_in4(self) -> str:
        current_power = self.power * (1.0 + abs(self.t - 25.0) * 0.05) if self.status else 0.0
        return f"SmartAC   [{self.id}] {self.name} | Status: {'ON' if self.status else 'OFF'} | Temp: {self.t:.1f}C | Power: {current_power:.1f}W"

    def get_power_const(self) -> float:
        if not self.status: return 0.0
        return self.power * (1.0 + abs(self.t - 25.0) * 0.05)


class SmartLock(Device):
    def __init__(self, device_id: str = "", name: str = "", passcode: str = "0000"):
        super().__init__(device_id, name, 5.0)
        self.lock = True
        self.passcode = passcode

    def get_lock(self) -> bool: return self.lock
    def get_pass(self) -> str: return self.passcode
    def get_passcode(self) -> str: return self.passcode

    def set_pass(self, p: str): self.passcode = p
    def set_passcode(self, p: str): self.set_pass(p)

    def operate(self):
        self.check_connection()
        self.status = True
        self.lock = not self.lock
        action = "KHOA" if self.lock else "MO KHOA"
        msg = f"[SmartLock] {self.name} -> {action}"
        print(f"  {msg}")
        Logger.log(msg)

    def unlock(self, code: str) -> bool:
        self.check_connection()
        if code == self.passcode:
            self.lock = False
            Logger.log(f"[SmartLock] {self.name} -> MO KHOA bang mat khau")
            return True
        Logger.log_error(f"[SmartLock] {self.name} -> Sai mat khau!")
        return False

    def get_power_consumption(self) -> float:
        return self.power if self.status else 0.0

    def get_in4(self) -> str:
        current_power = self.power if self.status else 0.0
        return f"SmartLock [{self.id}] {self.name} | Lock: {'LOCKED' if self.lock else 'UNLOCKED'} | Power: {current_power:.1f}W"

    def get_power_const(self) -> float:
        return self.power if self.status else 0.0

class Room:
    def __init__(self, name: str = ""):
        self.name = name
        self.devices = []

    def get_name(self) -> str: return self.name
    def get_room_name(self) -> str: return self.name
    def get_device_count(self) -> int: return len(self.devices)

    def get_device(self, index: int) -> Device:
        if index < 0 or index >= len(self.devices):
            raise IndexError(f"Device index out of range in room {self.name}")
        return self.devices[index]

    def set_name(self, name: str): self.name = name
    def set_room_name(self, name: str): self.set_name(name)

    def add_device(self, device: Device):
        self.devices.append(device)
        Logger.log(f"Them thiet bi '{device.get_name()}' vao phong {self.name}")

    def addDevice(self, device: Device): self.add_device(device)

    def remove_device(self, index: int) -> bool:
        if index < 0 or index >= len(self.devices):
            return False
        Logger.log(f"Xoa thiet bi '{self.devices[index].get_name()}' khoi phong {self.name}")
        del self.devices[index]
        return True

    def removeDevice(self, index: int) -> bool: return self.remove_device(index)

    def get_room_power(self) -> float:
        return sum(dev.get_power_consumption() for dev in self.devices)

    def getRoomPower(self) -> float: return self.get_room_power()

    def get_info(self) -> str:
        lines = [f"Phong: {self.name} ({len(self.devices)} thiet bi)"]
        for dev in self.devices:
            lines.append(f"    {dev.get_in4()}")
        lines.append(f"    >> Tong dien phong: {self.get_room_power():.1f}W\n")
        return "\n".join(lines)


class SmartHomeHub:
    def __init__(self, name: str = ""):
        self.name = name
        self.rooms = []

    def get_name(self) -> str: return self.name
    def get_hub_name(self) -> str: return self.name
    def get_room_count(self) -> int: return len(self.rooms)

    def get_room(self, index: int) -> Room:
        if index < 0 or index >= len(self.rooms):
            raise IndexError("Room index out of range")
        return self.rooms[index]

    def set_name(self, name: str): self.name = name
    def set_hub_name(self, name: str): self.set_name(name)

    def add_room(self, room: Room):
        self.rooms.append(room)
        Logger.log(f"Them phong '{room.get_name()}' vao hub {self.name}")

    def addRoom(self, room: Room): self.add_room(room)

    def get_total_power(self) -> float:
        return sum(room.get_room_power() for room in self.rooms)

    def getTotalPower(self) -> float: return self.get_total_power()

    def save_state_to_file(self, filename: str):
        try:
            with open(filename, "a", encoding="utf-8") as file:
                file.write("\n========== TRANG THAI HE THONG ==========\n")
                file.write(f"Hub: {self.name} | So phong: {len(self.rooms)}\n")
                for room in self.rooms:
                    file.write(f"\n  {room.get_info()}")
                file.write(f"\n>> TONG DIEN NANG TOAN NHA: {self.get_total_power():.1f}W\n")
                file.write("==========================================\n")
            Logger.log(f"Da luu trang thai he thong ra file {filename}")
        except Exception as e:
            Logger.log_error(f"Khong the mo file {filename}: {str(e)}")

    def saveStateToFile(self, filename: str): self.save_state_to_file(filename)

    def display_status(self):
        print(f"\n  Hub: {self.name} | So phong: {len(self.rooms)}")
        for room in self.rooms:
            print(f"  {room.get_info()}", end="")
        print(f"  >> TONG DIEN NANG TOAN NHA: {self.get_total_power():.1f}W")

    def printStatus(self): self.display_status()


def main():
    Logger.clear_log()
    Logger.log("=== KHOI DONG HE THONG SMART HOME HUB ===")
    
    hub_name = input("Nhap ten Hub: ")
    hub = SmartHomeHub(hub_name)
    device_counter = 0

    while True:
        print("\n" + "="*50)
        print("  SMART HOME HUB - MENU CHINH")
        print("="*50)
        print("  1. Them phong moi")
        print("  2. Them thiet bi vao phong")
        print("  3. Xem trang thai he thong")
        print("  4. Bat/Tat thiet bi (operate)")
        print("  5. Chinh thong so thiet bi")
        print("  6. Tinh tong dien nang")
        print("  7. Cong dien nang 2 thiet bi (operator+)")
        print("  8. Mo khoa SmartLock (nhap mat khau)")
        print("  9. Gia lap mat ket noi thiet bi")
        print("  10. Xuat trang thai ra file home_data.txt")
        print("  0. Thoat")
        print("-" * 50)
        
        try:
            choice = int(input("  Lua chon: "))
        except ValueError:
            print("  !! Lua chon khong hop le.")
            continue

        if choice == 0:
            print("\n  Tam biet! Da thoat chuong trinh.\n")
            Logger.log("=== TAT HE THONG ===")
            break

        elif choice == 1:
            rname = input("  Nhap ten phong: ")
            hub.add_room(Room(rname))
            print(f"  >> Da them phong '{rname}'. Tong so phong: {hub.get_room_count()}")

        elif choice == 2:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao. Hay them phong truoc.")
                continue
            
            print("  Danh sach phong:")
            for i in range(hub.get_room_count()):
                print(f"    {i}. {hub.get_room(i).get_name()}")
            
            try:
                ri = int(input("  Chon phong (so): "))
                if ri < 0 or ri >= hub.get_room_count(): raise ValueError()
            except ValueError:
                print("  !! Phong khong hop le.")
                continue

            print("  Loai thiet bi: 1-SmartLight  2-SmartAC  3-SmartLock")
            try:
                dtype = int(input("  Chon: "))
            except ValueError:
                dtype = -1

            device_counter += 1
            did = f"D{device_counter}"
            dname = input("  Nhap ten thiet bi: ")

            if dtype == 1:
                bp = float(input("  Nhap cong suat co ban (W): "))
                br = int(input("  Nhap do sang (0-100): "))
                cl = input("  Nhap mau sac: ")
                hub.get_room(ri).addDevice(SmartLight(did, dname, bp, br, cl))
                print(f"  >> Da them SmartLight '{dname}' vao phong {hub.get_room(ri).get_room_name()}")
            
            elif dtype == 2:
                bp = float(input("  Nhap cong suat co ban (W): "))
                temp = float(input("  Nhap nhiet do (C): "))
                hub.get_room(ri).addDevice(SmartAC(did, dname, bp, temp))
                print(f"  >> Da them SmartAC '{dname}' vao phong {hub.get_room(ri).get_room_name()}")
            
            elif dtype == 3:
                passw = input("  Nhap mat khau: ")
                hub.get_room(ri).addDevice(SmartLock(did, dname, passw))
                print(f"  >> Da them SmartLock '{dname}' vao phong {hub.get_room(ri).get_room_name()}")
            
            else:
                print("  !! Loai thiet bi khong hop le.")

        elif choice == 3:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            hub.printStatus()

        elif choice == 4:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            
            print("  Danh sach phong:")
            for i in range(hub.get_room_count()):
                print(f"    {i}. {hub.get_room(i).get_room_name()} ({hub.get_room(i).get_device_count()} thiet bi)")
            
            try:
                ri = int(input("  Chon phong (so): "))
                if ri < 0 or ri >= hub.get_room_count(): raise ValueError()
            except ValueError:
                print("  !! Phong khong hop le.")
                continue

            room = hub.get_room(ri)
            if room.get_device_count() == 0:
                print("  !! Phong nay chua co thiet bi.")
                continue

            print("  Danh sach thiet bi:")
            for j in range(room.get_device_count()):
                print(f"    {j}. {room.get_device(j).get_info()}")

            try:
                di = int(input("  Chon thiet bi (so): "))
                dev = room.get_device(di)
            except (ValueError, IndexError):
                print("  !! Thiet bi khong hop le.")
                continue

            try:
                dev.operate()
            except ConnectionException as e:
                print(f"  !! EXCEPTION: {e}")
                Logger.log_error(str(e))

        elif choice == 5:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            
            print("  Danh sach phong:")
            for i in range(hub.get_room_count()):
                print(f"    {i}. {hub.get_room(i).get_room_name()}")
            
            try:
                ri = int(input("  Chon phong (so): "))
                if ri < 0 or ri >= hub.get_room_count(): raise ValueError()
            except ValueError:
                print("  !! Phong khong hop le.")
                continue

            room = hub.get_room(ri)
            if room.get_device_count() == 0:
                print("  !! Phong nay chua co thiet bi.")
                continue

            print("  Danh sach thiet bi:")
            for j in range(room.get_device_count()):
                print(f"    {j}. {room.get_device(j).get_info()}")

            try:
                di = int(input("  Chon thiet bi (so): "))
                dev = room.get_device(di)
            except (ValueError, IndexError):
                print("  !! Thiet bi khong hop le.")
                continue

            if isinstance(dev, SmartLight):
                br = int(input("  Nhap do sang moi (0-100): "))
                cl = input("  Nhap mau moi: ")
                dev.set_brightness(br)
                dev.set_color(cl)
                print(f"  >> {dev.get_info()}")
                Logger.log(f"Chinh thong so: {dev.get_info()}")
                
            elif isinstance(dev, SmartAC):
                temp = float(input("  Nhap nhiet do moi (C): "))
                dev.set_temperature(temp)
                print(f"  >> {dev.get_info()}")
                Logger.log(f"Chinh thong so: {dev.get_info()}")
                
            elif isinstance(dev, SmartLock):
                newpass = input("  Nhap mat khau moi: ")
                dev.set_passcode(newpass)
                print("  >> Da doi mat khau thanh cong.")
                Logger.log(f"Doi mat khau: {dev.get_name()}")

        elif choice == 6:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            for i in range(hub.get_room_count()):
                print(f"  Phong '{hub.get_room(i).get_room_name()}': {hub.get_room(i).getRoomPower():.1f}W")
            print(f"  >> TONG DIEN NANG TOAN NHA: {hub.getTotalPower():.1f}W")

        elif choice == 7:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            
            print("  --- Chon thiet bi thu 1 ---")
            print("  Danh sach phong:")
            for i in range(hub.get_room_count()):
                print(f"    {i}. {hub.get_room(i).get_room_name()}")
            
            try:
                r1 = int(input("  Phong: "))
                room1 = hub.get_room(r1)
                for j in range(room1.get_device_count()):
                    print(f"    {j}. {room1.get_device(j).get_name()}")
                d1 = int(input("  Thiet bi: "))
                dev1 = room1.get_device(d1)
                
                print("  --- Chon thiet bi thu 2 ---")
                r2 = int(input("  Phong: "))
                room2 = hub.get_room(r2)
                for j in range(room2.get_device_count()):
                    print(f"    {j}. {room2.get_device(j).get_name()}")
                d2 = int(input("  Thiet bi: "))
                dev2 = room2.get_device(d2)
            except (ValueError, IndexError):
                print("  !! Sai.")
                continue

            total_sum = dev1 + dev2
            print(f"  {dev1.get_name()} + {dev2.get_name()} = {total_sum:.1f}W")

        elif choice == 8:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            
            print("  Danh sach phong:")
            for i in range(hub.get_room_count()):
                print(f"    {i}. {hub.get_room(i).get_room_name()}")
                
            try:
                ri = int(input("  Chon phong: "))
                room = hub.get_room(ri)
                
                print("  Danh sach thiet bi:")
                for j in range(room.get_device_count()):
                    print(f"    {j}. {room.get_device(j).get_info()}")
                    
                di = int(input("  Chon thiet bi SmartLock: "))
                dev = room.get_device(di)
            except (ValueError, IndexError):
                print("  !! Sai.")
                continue
                
            if not isinstance(dev, SmartLock):
                print("  !! Thiet bi nay khong phai SmartLock.")
                continue
                
            code = input("  Nhap mat khau: ")
            try:
                ok = dev.unlock(code)
                print(f"  >> Ket qua: {'MO KHOA THANH CONG' if ok else 'SAI MAT KHAU'}")
            except ConnectionException as e:
                print(f"  !! EXCEPTION: {e}")
                Logger.log_error(str(e))

        elif choice == 9:
            if hub.get_room_count() == 0:
                print("  !! Chua co phong nao.")
                continue
            
            print("  Danh sach phong:")
            for i in range(hub.get_room_count()):
                print(f"    {i}. {hub.get_room(i).get_room_name()}")
                
            try:
                ri = int(input("  Chon phong: "))
                room = hub.get_room(ri)
                if room.get_device_count() == 0:
                    print("  !! Phong nay chua co thiet bi.")
                    continue
                    
                for j in range(room.get_device_count()):
                    print(f"    {j}. {room.get_device(j).get_info()}")
                    
                di = int(input("  Chon thiet bi: "))
                dev = room.get_device(di)
                
                mode = int(input("  1-Mat ket noi  2-Khoi phuc ket noi: "))
            except (ValueError, IndexError):
                print("  !! Sai.")
                continue

            if mode == 1:
                dev.set_online(False)
                print(f"  >> '{dev.get_name()}' da MAT KET NOI.")
                Logger.log(f"Gia lap mat ket noi: {dev.get_name()}")
            else:
                dev.set_online(True)
                print(f"  >> '{dev.get_name()}' da KHOI PHUC ket noi.")
                Logger.log(f"Khoi phuc ket noi: {dev.get_name()}")

        elif choice == 10:
            hub.saveStateToFile("home_data.txt")
            print("  >> Da xuat trang thai ra file 'home_data.txt'")
            
        else:
            print("  !! Lua chon khong hop le. Vui long chon lai.")

if __name__ == "__main__":
    main()
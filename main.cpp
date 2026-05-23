#include <bits/stdc++.h>
#define fl ios_base::sync_with_stdio(false), cin.tie(NULL), cout.tie(NULL)
#define lin signed main()
using namespace std;
class logger {
    private:
    static string get_timestamp() {
        time_t now = time(nullptr);
        char buf[64];
        strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", localtime(&now));
        return string(buf);
    }
    public:
    static void log(const string &message) {
        ofstream file("home_data.txt", ios::app);
        if (file.is_open()) file << "[LOG " << get_timestamp() << "] " << message << "\n";
    }
    static void log_error(const string &message) {
        ofstream file("home_data.txt", ios::app);
        if (file.is_open()) file << "[ERROR " << get_timestamp() << "] " << message << "\n";
    }
    static void clear_log() {
        ofstream file("home_data.txt", ios::trunc);
    }
    static void write(const string &filename, const string &content) {
        ofstream file(filename, ios::app);
        if (file.is_open()) file << content;
    }
};

class ConnectionException : public exception {
    private:
        string message;
    public:
        explicit ConnectionException(const string &device_name) : message("ConnectionException: Thiet bi '" + device_name + "' mat ket noi!") {}
        const char* what() const noexcept override { return message.c_str(); }
};
class Device {
    protected:
        string id;
        string name;
        bool status;
        double power;
        bool onl;
        void check_connection() {
            if (!onl) {
                throw ConnectionException(name);
            }
        }
        virtual double get_power_const() const = 0;
    public:
        Device() : id(""), name(""), status(false), power(0.0), onl(true) {}
        Device(const string &id, const string &n, double p) : id(id), name(n), status(false), power(p), onl(true) {}
        virtual ~Device() {}
        virtual void operate() = 0;
        virtual double get_power_consumption() = 0;
        virtual string get_in4() const = 0;
        string get_info() const { return get_in4(); }
        friend double operator+(const Device &a, const Device &b) {
            return a.get_power_const() + b.get_power_const();
        }
        string get_id() const { return id; }
        string get_name() const { return name; }
        bool get_status() const { return status; }
        double get_power() const { return power; }
        bool get_onl() const { return onl; }
        bool get_is_online() const { return get_onl(); }
        void set_id(const string &id) { this->id = id; }
        void set_name(const string &n) { this->name = n; }
        void set_status(bool s) { this->status = s; }
        void set_power(double p) { this->power = p; }
        void set_onl(bool o) { this->onl = o; }
        void set_online(bool o) { set_onl(o); }
        void turn_on() { status = true;}
        void turn_off() { status = false; }
};
class SmartLight : public Device {
    private:
        int bright;
        string color;
    public:
        SmartLight() : bright(100), color("White") {}
        SmartLight(const string &id, const string &n, double p, int b, const string &c) : Device(id, n, p), bright(b), color(c) {}
        int get_bright() const { return bright; }
        int get_brightness() const { return bright; }
        string get_color() const { return color; }
        void set_bright(int b) { bright = (b < 0) ? 0 : (b > 100 ? 100 : b); }
        void set_brightness(int b) { set_bright(b); }
        void set_color(const string &c) { color = c; }
        void operate() override {
            check_connection();
            status = !status;
            string action = status ? "BAT" : "TAT";
            string msg = "[SmartLight] " + name + " -> " + action + " | Brightness: " + to_string(bright) + "% | Color: " + color;
            cout << "  " << msg << endl;
            logger::log(msg);
        }
        double get_power_consumption() override {
            if (!status) return 0.0;
            return power * (bright / 100.0);
        }
        string get_in4() const override {
            ostringstream oss;
            oss << "SmartLight [" << id << "] " << name << " | Brightness: " << bright << "% | Color: " << color << " | Power: " << (status ? power * (bright / 100.0) : 0.0) << "W";
            return oss.str();
        }
    protected:
        double get_power_const() const override {
            if (!status) return 0.0;
            return power * (bright / 100.0);
        }
};

class SmartAC : public Device {
    private:
        double t;
    public:
        SmartAC(): t(25.0) {}
        SmartAC(const string &id, const string &n, double p, double temperature) : Device(id, n, p), t(temperature) {}
        double get_temperature() const { return t; }
        void set_temperature(double temperature) { t = temperature; }
        void operate() override {
            check_connection();
            status = !status;
            string action = status ? "BAT" : "TAT";
            string msg = "[SmartAC] " + name + " -> " + action + " | Temperature: " + to_string(t) + "°C";
            cout << "  " << msg << endl;
            logger::log(msg);
        }
        double get_power_consumption() override {
            if (!status) return 0.0;
            return power;
        }
        string get_in4() const override {
            ostringstream oss;
            oss << "SmartAC [" << id << "] " << name << " | Temperature: " << t << "°C | Power: " << (status ? power : 0.0) << "W";
            return oss.str();
        }
    protected:
        double get_power_const() const override {
            if (!status) return 0.0;
            return power;
        }
};

class SmartLock : public Device {
    private:
        bool lock;
        string pass;
    public:
        SmartLock() : lock(true), pass("0000") {}
        SmartLock(const string &id, const string &n, const string &p) : Device(id, n, 5.0), lock(true), pass(p) {}
        bool get_lock() const { return lock; }
        string get_pass() const { return pass; }
        string get_passcode() const { return pass; }
        void set_pass(const string &p) { pass = p; }
        void set_passcode(const string &p) { set_pass(p); }
        void operate() override {
            check_connection();
            status = true;
            lock = !lock;
            string action = lock ? "KHOA" : "MO KHOA";
            string msg = "[SmartLock] " + name + " -> " + action;
            cout << "  " << msg << endl;
            logger::log(msg);
        }
        bool unlock(const string &code) {
            check_connection();
            if (code == pass) {
                lock = false;
                logger::log("[SmartLock] " + name + " -> MO KHOA bang mat khau");
                return true;
            }
            logger::log_error("[SmartLock] " + name + " -> Sai mat khau!");
            return false;
        }
        double get_power_consumption() override {
            return status ? power : 0.0;
        }
        string get_in4() const override {
            ostringstream oss;
            oss << "SmartLock [" << id << "] " << name << " | Lock: " << (lock ? "LOCKED" : "UNLOCKED") << " | Power: " << (status ? power : 0.0) << "W";
            return oss.str();
        }
    protected:
        double get_power_const() const override {
            return status ? power : 0.0;
        }
};
class Room {
    private:
        string name;
        vector<shared_ptr<Device>> devices;
    public:
        Room() : name("") {}
        explicit Room(const string &n) : name(n) {}
        string get_name() const { return name; }
        string get_room_name() const { return name; }
        size_t get_device_count() const { return devices.size(); }
        shared_ptr<Device> get_device(size_t index) const {
            if (index >= devices.size()) throw out_of_range("Device index out of range in room " + name);
            return devices[index];
        }
        void set_name(const string &n) { name = n; }
        void set_room_name(const string &n) { set_name(n); }
        void add_device(shared_ptr<Device> device) {
            devices.push_back(move(device));
            logger::log("Them thiet bi '" + devices.back()->get_name() + "' vao phong " + name);
        }
        void addDevice(shared_ptr<Device> device) { add_device(move(device)); }
        bool remove_device(size_t index) {
            if (index >= devices.size()) return false;
            logger::log("Xoa thiet bi '" + devices[index]->get_name() + "' khoi phong " + name);
            devices.erase(devices.begin() + static_cast<long>(index));
            return true;
        }
        bool removeDevice(size_t index) { return remove_device(index); }
        double get_room_power() const {
            double total = 0.0;
            for (const auto &dev : devices) total += dev->get_power_consumption();
            return total;
        }
        double getRoomPower() const { return get_room_power(); }
        string get_info() const {
            ostringstream oss;
            oss << "Phong: " << name << " (" << devices.size() << " thiet bi)\n";
            for (const auto &dev : devices) oss << "    " << dev->get_in4() << "\n";
            oss << "    >> Tong dien phong: " << fixed << setprecision(1) << get_room_power() << "W\n";
            return oss.str();
        }
};

class SmartHomeHub {
    private:
        string name;
        vector<Room> roooms;
    public:
        SmartHomeHub() : name("") {}
        explicit SmartHomeHub(const string &n) : name(n) {}
        string get_name() const { return name; }
        string get_hub_name() const { return name; }
        size_t get_room_count() const { return roooms.size(); }
        Room &get_room(size_t index) {
            if (index >= roooms.size()) throw out_of_range("Room index out of range");
            return roooms[index];
        }
        void set_name(const string &n) { name = n; }
        void set_hub_name(const string &n) { set_name(n); }
        void add_room(const Room &room) {
            roooms.push_back(room);
            logger::log("Them phong '" + room.get_name() + "' vao hub " + name);
        }
        void addRoom(const Room &room) { add_room(room); }
        double get_total_power() const {
            double total = 0.0;
            for (const auto &room : roooms) total += room.get_room_power();
            return total;
        }
        double getTotalPower() const { return get_total_power(); }
        void save_state_to_file(const string &filename) const {
            ofstream file(filename, ios::app);
            if (!file.is_open()) {
                logger::log_error("Khong the mo file " + filename);
                return;
            }
            file << "\n========== TRANG THAI HE THONG ==========\n";
            file << "Hub: " << name << " | So phong: " << roooms.size() << "\n";
            for (const auto &room : roooms) file << "\n  " << room.get_info();
            file << "\n>> TONG DIEN NANG TOAN NHA: " << fixed << setprecision(1) << get_total_power() << "W\n";
            file << "==========================================\n";
            logger::log("Da luu trang thai he thong ra file " + filename);
        }
        void saveStateToFile(const string &filename) const { save_state_to_file(filename); }
        void display_status() const {
            cout << "\n  Hub: " << name << " | So phong: " << roooms.size() << endl;
            for (const auto &room : roooms) cout << "  " << room.get_info();
            cout << "  >> TONG DIEN NANG TOAN NHA: " << fixed << setprecision(1) << get_total_power() << "W" << endl;
        }
        void printStatus() const { display_status(); }
};

void print_set(const string &title = "") {
    cout << "\n" << string(65, '=') << endl;
    if (!title.empty()) {
        cout << "  " << title << endl;
        cout << string(65, '=') << endl;
    }
}

lin {
    fl;
    cout << fixed << setprecision(1);
    logger::clear_log();
    logger::log("=== KHOI DONG HE THONG SMART HOME HUB ===");
    string hub_name;
    cout << "Nhap ten Hub: ";
    getline(cin, hub_name);
    SmartHomeHub hub(hub_name);
    size_t device_counter = 0;
    int choice;
    while (true){
        cout << "\n" << string(50, '=') << endl;
        cout << "  SMART HOME HUB - MENU CHINH" << endl;
        cout << string(50, '=') << endl;
        cout << "  1. Them phong moi" << endl;
        cout << "  2. Them thiet bi vao phong" << endl;
        cout << "  3. Xem trang thai he thong" << endl;
        cout << "  4. Bat/Tat thiet bi (operate)" << endl;
        cout << "  5. Chinh thong so thiet bi" << endl;
        cout << "  6. Tinh tong dien nang" << endl;
        cout << "  7. Cong dien nang 2 thiet bi (operator+)" << endl;
        cout << "  8. Mo khoa SmartLock (nhap mat khau)" << endl;
        cout << "  9. Gia lap mat ket noi thiet bi" << endl;
        cout << "  10. Xuat trang thai ra file home_data.txt" << endl;
        cout << "  0. Thoat" << endl;
        cout << string(50, '-') << endl;
        cout << "  Lua chon: ";
        cin >> choice;
        cin.ignore();
        if (choice == 0) {
            cout << "\n  Tam biet! Da thoat chuong trinh.\n" << endl;
            logger::log("=== TAT HE THONG ===");
            break;
        }
        if (choice == 1) {
            string rname;
            cout << "  Nhap ten phong: ";
            getline(cin, rname);
            hub.add_room(Room(rname));
            cout << "  >> Da them phong '" << rname << "'. Tong so phong: " << hub.get_room_count() << endl;
        }
        else if (choice == 2) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao. Hay them phong truoc." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i) {
                cout << "    " << i << ". " << hub.get_room(i).get_name() << endl;
            }
            size_t ri;
            cout << "  Chon phong (so): ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count()) {
                cout << "  !! Phong khong hop le." << endl;
                continue;
            }
            int dtype;
            cout << "  Loai thiet bi: 1-SmartLight  2-SmartAC  3-SmartLock" << endl;
            cout << "  Chon: ";
            cin >> dtype;
            cin.ignore();
            string did = "D" + to_string(++device_counter);
            string dname;
            cout << "  Nhap ten thiet bi: ";
            getline(cin, dname);
            if (dtype == 1) {
                double bp;
                int br;
                string cl;
                cout << "  Nhap cong suat co ban (W): ";
                cin >> bp;
                cout << "  Nhap do sang (0-100): ";
                cin >> br;
                cin.ignore();
                cout << "  Nhap mau sac: ";
                getline(cin, cl);
                hub.get_room(ri).addDevice(
                    make_shared<SmartLight>(did, dname, bp, br, cl));
                cout << "  >> Da them SmartLight '" << dname << "' vao phong " << hub.get_room(ri).get_room_name() << endl;
            }
            else if (dtype == 2) {
                double bp, temp;
                cout << "  Nhap cong suat co ban (W): ";
                cin >> bp;
                cout << "  Nhap nhiet do (C): ";
                cin >> temp;
                cin.ignore();
                hub.get_room(ri).addDevice(make_shared<SmartAC>(did, dname, bp, temp));
                cout << "  >> Da them SmartAC '" << dname << "' vao phong " << hub.get_room(ri).get_room_name() << endl;
            }
            else if (dtype == 3) {
                string pass;
                cout << "  Nhap mat khau: ";
                getline(cin, pass);
                hub.get_room(ri).addDevice(make_shared<SmartLock>(did, dname, pass));
                cout << "  >> Da them SmartLock '" << dname << "' vao phong " << hub.get_room(ri).get_room_name() << endl;
            }
            else {
                cout << "  !! Loai thiet bi khong hop le." << endl;
            }
        }
        else if (choice == 3) {
            if (hub.get_room_count() == 0){
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            hub.printStatus();
        }
        else if (choice == 4) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i) {
                cout << "    " << i << ". " << hub.get_room(i).get_room_name() << " (" << hub.get_room(i).get_device_count() << " thiet bi)" << endl;
            }
            size_t ri;
            cout << "  Chon phong (so): ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count()) {
                cout << "  !! Phong khong hop le." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            if (room.get_device_count() == 0) {
                cout << "  !! Phong nay chua co thiet bi." << endl;
                continue;
            }
            cout << "  Danh sach thiet bi:" << endl;
            for (size_t j = 0; j < room.get_device_count(); ++j) {
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            }
            size_t di;
            cout << "  Chon thiet bi (so): ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count()) {
                cout << "  !! Thiet bi khong hop le." << endl;
                continue;
            }
            try {
                room.get_device(di)->operate();
            }
            catch (const ConnectionException &e) {
                cout << "  !! EXCEPTION: " << e.what() << endl;
                logger::log_error(e.what());
            }
        }
        else if (choice == 5) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i) {
                cout << "    " << i << ". " << hub.get_room(i).get_room_name() << endl;
            }
            size_t ri;
            cout << "  Chon phong (so): ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count()) {
                cout << "  !! Phong khong hop le." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            if (room.get_device_count() == 0) {
                cout << "  !! Phong nay chua co thiet bi." << endl;
                continue;
            }
            cout << "  Danh sach thiet bi:" << endl;
            for (size_t j = 0; j < room.get_device_count(); ++j) {
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            }
            size_t di;
            cout << "  Chon thiet bi (so): ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count()) {
                cout << "  !! Thiet bi khong hop le." << endl;
                continue;
            }
            auto dev = room.get_device(di);
            auto sl = dynamic_pointer_cast<SmartLight>(dev);
            auto sa = dynamic_pointer_cast<SmartAC>(dev);
            auto sk = dynamic_pointer_cast<SmartLock>(dev);
            if (sl) {
                int br;
                string cl;
                cout << "  Nhap do sang moi (0-100): ";
                cin >> br;
                cin.ignore();
                cout << "  Nhap mau moi: ";
                getline(cin, cl);
                sl->set_brightness(br);
                sl->set_color(cl);
                cout << "  >> " << sl->get_info() << endl;
                logger::log("Chinh thong so: " + sl->get_info());
            }
            else if (sa) {
                double temp;
                cout << "  Nhap nhiet do moi (C): ";
                cin >> temp;
                cin.ignore();
                sa->set_temperature(temp);
                cout << "  >> " << sa->get_info() << endl;
                logger::log("Chinh thong so: " + sa->get_info());
            }
            else if (sk) {
                string newpass;
                cout << "  Nhap mat khau moi: ";
                getline(cin, newpass);
                sk->set_passcode(newpass);
                cout << "  >> Da doi mat khau thanh cong." << endl;
                logger::log("Doi mat khau: " + sk->get_name());
            }
        }
        else if (choice == 6) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            for (size_t i = 0; i < hub.get_room_count(); ++i) {
                cout << "  Phong '" << hub.get_room(i).get_room_name() << "': " << hub.get_room(i).getRoomPower() << "W" << endl;
            }
            cout << "  >> TONG DIEN NANG TOAN NHA: " << hub.getTotalPower() << "W" << endl;
        }
        else if (choice == 7) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  --- Chon thiet bi thu 1 ---" << endl;
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i)
                cout << "    " << i << ". " << hub.get_room(i).get_room_name() << endl;
            size_t r1, d1;
            cout << "  Phong: ";
            cin >> r1;
            if (r1 >= hub.get_room_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            for (size_t j = 0; j < hub.get_room(r1).get_device_count(); ++j)
                cout << "    " << j << ". " << hub.get_room(r1).get_device(j)->get_name() << endl;
            cout << "  Thiet bi: ";
            cin >> d1;
            if (d1 >= hub.get_room(r1).get_device_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            cout << "  --- Chon thiet bi thu 2 ---" << endl;
            size_t r2, d2;
            cout << "  Phong: ";
            cin >> r2;
            if (r2 >= hub.get_room_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            for (size_t j = 0; j < hub.get_room(r2).get_device_count(); ++j)
                cout << "    " << j << ". " << hub.get_room(r2).get_device(j)->get_name() << endl;
            cout << "  Thiet bi: ";
            cin >> d2;
            cin.ignore();
            if (d2 >= hub.get_room(r2).get_device_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            auto &dev1 = *hub.get_room(r1).get_device(d1);
            auto &dev2 = *hub.get_room(r2).get_device(d2);
            double sum = dev1 + dev2;
            cout << "  " << dev1.get_name() << " + " << dev2.get_name() << " = " << sum << "W" << endl;
        }
        else if (choice == 8) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i)
                cout << "    " << i + 1 << ". " << hub.get_room(i).get_room_name() << endl;
            size_t ri;
            cout << "  Chon phong: ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            cout << "  Danh sach thiet bi:" << endl;
            for (size_t j = 0; j < room.get_device_count(); ++j)
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            size_t di;
            cout << "  Chon thiet bi SmartLock: ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            auto sk = dynamic_pointer_cast<SmartLock>(room.get_device(di));
            if (!sk) {
                cout << "  !! Thiet bi nay khong phai SmartLock." << endl;
                continue;
            }
            string code;
            cout << "  Nhap mat khau: ";
            getline(cin, code);
            try {
                bool ok = sk->unlock(code);
                cout << "  >> Ket qua: " << (ok ? "MO KHOA THANH CONG" : "SAI MAT KHAU") << endl;
            }
            catch (const ConnectionException &e) {
                cout << "  !! EXCEPTION: " << e.what() << endl;
                logger::log_error(e.what());
            }
        }
        else if (choice == 9) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i)
                cout << "    " << i << ". " << hub.get_room(i).get_room_name() << endl;
            size_t ri;
            cout << "  Chon phong: ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            if (room.get_device_count() == 0) {
                cout << "  !! Phong nay chua co thiet bi." << endl;
                continue;
            }
            for (size_t j = 0; j < room.get_device_count(); ++j)
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            size_t di;
            cout << "  Chon thiet bi: ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count()) {
                cout << "  !! Sai." << endl;
                continue;
            }
            int mode;
            cout << "  1-Mat ket noi  2-Khoi phuc ket noi: ";
            cin >> mode;
            cin.ignore();
            auto dev = room.get_device(di);
            if (mode == 1) {
                dev->set_online(false);
                cout << "  >> '" << dev->get_name() << "' da MAT KET NOI." << endl;
                logger::log("Gia lap mat ket noi: " + dev->get_name());
            }
            else {
                dev->set_online(true);
                cout << "  >> '" << dev->get_name() << "' da KHOI PHUC ket noi." << endl;
                logger::log("Khoi phuc ket noi: " + dev->get_name());
            }
        }
        else if (choice == 10) {
            hub.saveStateToFile("home_data.txt");
            cout << "  >> Da xuat trang thai ra file 'home_data.txt'" << endl;
        }
        else {
            cout << "  !! Lua chon khong hop le. Vui long chon lai." << endl;
        }
    }
}
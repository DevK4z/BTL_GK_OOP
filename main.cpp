#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <queue>
#include <memory>
#include <cmath>
#include <iomanip>
#include <sstream>
#include <algorithm>
#include <fstream>
#include <ctime>
#include <exception>

using namespace std;

class Logger {
public:
    static void log(const std::string &message) {
        std::ofstream file("home_data.txt", std::ios::app);
        if (file.is_open()) {
            file << "[LOG " << get_timestamp() << "] " << message << "\n";
        }
    }
    static void log_error(const std::string &message) {
        std::ofstream file("home_data.txt", std::ios::app);
        if (file.is_open()) {
            file << "[ERROR " << get_timestamp() << "] " << message << "\n";
        }
    }
    static void clear_log() {
        std::ofstream file("home_data.txt", std::ios::trunc);
    }
    static void write(const std::string &filename, const std::string &content) {
        std::ofstream file(filename, std::ios::app);
        if (file.is_open())
            file << content;
    }

private:
    static std::string get_timestamp() {
        std::time_t now = std::time(nullptr);
        char buf[64];
        std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", std::localtime(&now));
        return std::string(buf);
    }
};

class ConnectionException : public std::exception {
private:
    std::string message_;

public:
    explicit ConnectionException(const std::string &device_name)
        : message_("ConnectionException: Thiet bi '" + device_name +
                   "' mat ket noi!") {}
    const char *what() const noexcept override { return message_.c_str(); }
};

class Device {
protected:
    std::string id_;
    std::string name_;
    bool status_;
    double base_power_;
    bool is_online_;

public:
    Device() : status_(false), base_power_(0.0), is_online_(true) {}
    Device(const std::string &id, const std::string &name, double base_power, bool status = false)
        : id_(id),
          name_(name),
          status_(status),
          base_power_(base_power),
          is_online_(true) {}
    virtual ~Device() = default;
    virtual void operate() = 0;
    virtual double get_power_consumption() = 0;
    virtual std::string get_info() const = 0;
    friend double operator+(const Device &a, const Device &b) {
        return a.get_power_const() + b.get_power_const();
    }
    std::string get_id() const { return id_; }
    std::string get_name() const { return name_; }
    bool get_status() const { return status_; }
    double get_base_power() const { return base_power_; }
    bool get_is_online() const { return is_online_; }
    void set_id(const std::string &id) { id_ = id; }
    void set_name(const std::string &name) { name_ = name; }
    void set_status(bool s) { status_ = s; }
    void set_base_power(double p) { base_power_ = p; }
    void set_online(bool o) { is_online_ = o; }
    void turn_on() { status_ = true; }
    void turn_off() { status_ = false; }

protected:
    void check_connection() {
        if (!is_online_) {
            throw ConnectionException(name_);
        }
    }
    virtual double get_power_const() const = 0;
};

class SmartLight : public Device {
private:
    int brightness_;
    std::string color_;
public:
    SmartLight() : brightness_(100), color_("White") {}
    SmartLight(const std::string &id, const std::string &name, double base_power,
               bool status, int brightness, const std::string &color = "White")
        : Device(id, name, base_power, status), brightness_(brightness), color_(color) {}
    int get_brightness() const { return brightness_; }
    std::string get_color() const { return color_; }
    void set_brightness(int b) {
        brightness_ = (b < 0) ? 0 : (b > 100 ? 100 : b);
    }
    void set_color(const std::string &c) { color_ = c; }
    void operate() override {
        check_connection();
        status_ = !status_;
        std::string action = status_ ? "BAT" : "TAT";
        std::string msg = "[SmartLight] " + name_ + " -> " + action +
                          " | Brightness: " + std::to_string(brightness_) +
                          "% | Color: " + color_;
        Logger::log(msg);
    }
    double get_power_consumption() override {
        if (!status_)
            return 0.0;
        return base_power_ * (brightness_ / 100.0);
    }
    std::string get_info() const override {
        std::ostringstream oss;
        oss << "SmartLight [" << id_ << "] " << name_
            << " | Status: " << (status_ ? "ON" : "OFF")
            << " | Brightness: " << brightness_ << "%"
            << " | Color: " << color_ << " | Power: " << std::fixed
            << std::setprecision(1)
            << (status_ ? base_power_ * (brightness_ / 100.0) : 0.0) << "W";
        return oss.str();
    }

protected:
    double get_power_const() const override {
        if (!status_)
            return 0.0;
        return base_power_ * (brightness_ / 100.0);
    }
};

class SmartAC : public Device {
private:
    double temperature_;

public:
    SmartAC() : temperature_(25.0) {}
    SmartAC(const std::string &id, const std::string &name, double base_power,
            bool status, double temperature)
        : Device(id, name, base_power, status), temperature_(temperature) {}
    double get_temperature() const { return temperature_; }
    void set_temperature(double t) { temperature_ = t; }
    void operate() override {
        check_connection();
        status_ = !status_;
        std::ostringstream oss;
        oss << "[SmartAC] " << name_ << " -> " << (status_ ? "BAT" : "TAT")
            << " | Temp: " << std::fixed << std::setprecision(1) << temperature_
            << "C";
        Logger::log(oss.str());
    }
    double get_power_consumption() override {
        if (!status_)
            return 0.0;
        return base_power_ * (1.0 + std::abs(temperature_ - 25.0) * 0.05);
    }
    std::string get_info() const override {
        std::ostringstream oss;
        oss << "SmartAC   [" << id_ << "] " << name_
            << " | Status: " << (status_ ? "ON" : "OFF")
            << " | Temp: " << std::fixed << std::setprecision(1) << temperature_
            << "C"
            << " | Power: "
            << (status_ ? base_power_ * (1.0 + std::abs(temperature_ - 25.0) * 0.05)
                        : 0.0)
            << "W";
        return oss.str();
    }

protected:
    double get_power_const() const override {
        if (!status_)
            return 0.0;
        return base_power_ * (1.0 + std::abs(temperature_ - 25.0) * 0.05);
    }
};

class SmartLock : public Device {
private:
    bool is_locked_;
    std::string passcode_;

public:
    SmartLock() : is_locked_(true), passcode_("0000") { base_power_ = 5.0; }
    SmartLock(const std::string &id, const std::string &name, double base_power, bool status,
              const std::string &passcode = "0000")
        : Device(id, name, base_power, status), is_locked_(true), passcode_(passcode) {}
    bool get_is_locked() const { return is_locked_; }
    std::string get_passcode() const { return passcode_; }
    void set_passcode(const std::string &p) { passcode_ = p; }
    void operate() override {
        check_connection();
        status_ = true;
        is_locked_ = !is_locked_;
        std::string action = is_locked_ ? "KHOA" : "MO KHOA";
        std::string msg = "[SmartLock] " + name_ + " -> " + action;
        Logger::log(msg);
    }
    bool unlock(const std::string &code) {
        check_connection();
        if (code == passcode_) {
            is_locked_ = false;
            Logger::log("[SmartLock] " + name_ + " -> MO KHOA bang mat khau");
            return true;
        }
        Logger::log_error("[SmartLock] " + name_ + " -> Sai mat khau!");
        return false;
    }
    double get_power_consumption() override {
        return status_ ? base_power_ : 0.0;
    }
    std::string get_info() const override {
        std::ostringstream oss;
        oss << "SmartLock [" << id_ << "] " << name_
            << " | Lock: " << (is_locked_ ? "LOCKED" : "UNLOCKED")
            << " | Power: " << std::fixed << std::setprecision(1)
            << (status_ ? base_power_ : 0.0) << "W";
        return oss.str();
    }

protected:
    double get_power_const() const override {
        return status_ ? base_power_ : 0.0;
    }
};

class Room {
private:
    std::string room_name_;
    std::vector<std::shared_ptr<Device>> devices_;

public:
    Room() = default;
    explicit Room(const std::string &name) : room_name_(name) {}
    std::string get_room_name() const { return room_name_; }
    size_t get_device_count() const { return devices_.size(); }
    std::shared_ptr<Device> get_device(size_t index) const {
        if (index >= devices_.size())
            throw std::out_of_range("Device index out of range in room " +
                                    room_name_);
        return devices_[index];
    }
    void set_room_name(const std::string &name) { room_name_ = name; }
    void addDevice(std::shared_ptr<Device> device) {
        devices_.push_back(std::move(device));
        Logger::log("Them thiet bi '" + devices_.back()->get_name() +
                    "' vao phong " + room_name_);
    }
    bool removeDevice(size_t index) {
        if (index >= devices_.size())
            return false;
        Logger::log("Xoa thiet bi '" + devices_[index]->get_name() +
                    "' khoi phong " + room_name_);
        devices_.erase(devices_.begin() + static_cast<long>(index));
        return true;
    }
    double getRoomPower() const {
        double total = 0.0;
        for (const auto &dev : devices_) {
            total += dev->get_power_consumption();
        }
        return total;
    }
    std::string get_info() const {
        std::ostringstream oss;
        oss << "Phong: " << room_name_ << " (" << devices_.size() << " thiet bi)\n";
        for (const auto &dev : devices_) {
            oss << "    " << dev->get_info() << "\n";
        }
        oss << "    >> Tong dien phong: " << std::fixed << std::setprecision(1)
            << getRoomPower() << "W\n";
        return oss.str();
    }
};

class SmartHomeHub {
private:
    std::string hub_name_;
    std::vector<Room> rooms_;

public:
    SmartHomeHub() = default;
    explicit SmartHomeHub(const std::string &name) : hub_name_(name) {}
    std::string get_hub_name() const { return hub_name_; }
    size_t get_room_count() const { return rooms_.size(); }
    Room &get_room(size_t index) {
        if (index >= rooms_.size())
            throw std::out_of_range("Room index out of range");
        return rooms_[index];
    }
    void set_hub_name(const std::string &name) { hub_name_ = name; }
    void addRoom(const Room &room) {
        rooms_.push_back(room);
        Logger::log("Them phong '" + room.get_room_name() + "' vao hub " +
                    hub_name_);
    }
    double getTotalPower() const {
        double total = 0.0;
        for (const auto &room : rooms_) {
            total += room.getRoomPower();
        }
        return total;
    }
    void saveStateToFile(const std::string &filename) const {
        std::ofstream file(filename, std::ios::app);
        if (!file.is_open()) {
            Logger::log_error("Khong the mo file " + filename);
            return;
        }
        file << "\n========== TRANG THAI HE THONG ==========\n";
        file << "Hub: " << hub_name_ << " | So phong: " << rooms_.size() << "\n";
        for (const auto &room : rooms_) {
            file << "\n  " << room.get_info();
        }
        file << "\n>> TONG DIEN NANG TOAN NHA: " << std::fixed
             << std::setprecision(1) << getTotalPower() << "W\n";
        file << "==========================================\n";
        Logger::log("Da luu trang thai he thong ra file " + filename);
    }
    void printStatus() const {
        std::cout << "\n  Hub: " << hub_name_ << " | So phong: " << rooms_.size()
                  << std::endl;
        for (const auto &room : rooms_) {
            std::cout << "  " << room.get_info();
        }
        std::cout << "  >> TONG DIEN NANG TOAN NHA: " << std::fixed
                  << std::setprecision(1) << getTotalPower() << "W" << std::endl;
    }
};

class FloorPlanGraph {
private:
    std::unordered_map<std::string, std::vector<std::pair<std::string, double>>> adj;
public:
    void addEdge(const std::string& u, const std::string& v, double weight) {
        adj[u].push_back({v, weight});
        adj[v].push_back({u, weight});
    }

    std::vector<std::string> findShortestPath(const std::string& start, const std::string& end) {
        std::unordered_map<std::string, double> dist;
        std::unordered_map<std::string, std::string> prev;

        for (const auto& pair : adj) {
            dist[pair.first] = 1e9;
        }
        dist[start] = 0;

        using pdi = std::pair<double, std::string>;
        std::priority_queue<pdi, std::vector<pdi>, std::greater<pdi>> pq;
        pq.push({0, start});

        while (!pq.empty()) {
            double d = pq.top().first;
            std::string u = pq.top().second;
            pq.pop();

            if (d > dist[u]) continue;
            if (u == end) break;

            for (const auto& edge : adj[u]) {
                std::string v = edge.first;
                double weight = edge.second;
                if (dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    prev[v] = u;
                    pq.push({dist[v], v});
                }
            }
        }

        std::vector<std::string> path;
        if (dist.find(end) == dist.end() || dist[end] == 1e9) {
            return path;
        }

        for (std::string at = end; at != ""; at = prev[at]) {
            path.push_back(at);
            if (at == start) break;
        }
        std::reverse(path.begin(), path.end());
        return path;
    }
};

std::vector<std::string> split(const std::string &s, char delim) {
    std::vector<std::string> result;
    std::stringstream ss(s);
    std::string item;
    while (getline(ss, item, delim)) {
        result.push_back(item);
    }
    return result;
}

void print_sep(const std::string &title = "") {
    std::cout << "\n" << std::string(65, '=') << std::endl;
    if (!title.empty()) {
        std::cout << "  " << title << std::endl;
        std::cout << std::string(65, '=') << std::endl;
    }
}

void run_interactive_menu() {
    cout << fixed << setprecision(1);
    Logger::clear_log();
    Logger::log("=== KHOI DONG HE THONG SMART HOME HUB ===");
    string hub_name;
    cout << "Nhap ten Hub: ";
    getline(cin, hub_name);
    SmartHomeHub hub(hub_name);
    int device_counter = 0;
    int choice = 0;
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
            Logger::log("=== TAT HE THONG ===");
            break;
        }
        if (choice == 1) {
            string rname;
            cout << "  Nhap ten phong: ";
            getline(cin, rname);
            hub.addRoom(Room(rname));
            cout << "  >> Da them phong '" << rname << "'. Tong so phong: " << hub.get_room_count() << endl;
        }
        else if (choice == 2) {
            if (hub.get_room_count() == 0) {
                cout << "  !! Chua co phong nao. Hay them phong truoc." << endl;
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
                    make_shared<SmartLight>(did, dname, bp, false, br, cl));
                cout << "  >> Da them SmartLight '" << dname << "' vao phong " << hub.get_room(ri).get_room_name() << endl;
            }
            else if (dtype == 2)
            {
                double bp, temp;
                cout << "  Nhap cong suat co ban (W): ";
                cin >> bp;
                cout << "  Nhap nhiet do (C): ";
                cin >> temp;
                cin.ignore();
                hub.get_room(ri).addDevice(make_shared<SmartAC>(did, dname, bp, false, temp));
                cout << "  >> Da them SmartAC '" << dname << "' vao phong "
                     << hub.get_room(ri).get_room_name() << endl;
            }
            else if (dtype == 3)
            {
                string pass;
                cout << "  Nhap mat khau: ";
                getline(cin, pass);
                hub.get_room(ri).addDevice(make_shared<SmartLock>(did, dname, 5.0, false, pass));
                cout << "  >> Da them SmartLock '" << dname << "' vao phong "
                     << hub.get_room(ri).get_room_name() << endl;
            }
            else
            {
                cout << "  !! Loai thiet bi khong hop le." << endl;
            }
        }
        else if (choice == 3)
        {
            if (hub.get_room_count() == 0)
            {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            hub.printStatus();
        }
        else if (choice == 4)
        {
            if (hub.get_room_count() == 0)
            {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i)
            {
                cout << "    " << i << ". " << hub.get_room(i).get_room_name() << " ("
                     << hub.get_room(i).get_device_count() << " thiet bi)" << endl;
            }
            size_t ri;
            cout << "  Chon phong (so): ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count())
            {
                cout << "  !! Phong khong hop le." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            if (room.get_device_count() == 0)
            {
                cout << "  !! Phong nay chua co thiet bi." << endl;
                continue;
            }
            cout << "  Danh sach thiet bi:" << endl;
            for (size_t j = 0; j < room.get_device_count(); ++j)
            {
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            }
            size_t di;
            cout << "  Chon thiet bi (so): ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count())
            {
                cout << "  !! Thiet bi khong hop le." << endl;
                continue;
            }
            try
            {
                room.get_device(di)->operate();
            }
            catch (const ConnectionException &e)
            {
                cout << "  !! EXCEPTION: " << e.what() << endl;
                Logger::log_error(e.what());
            }
        }
        else if (choice == 5)
        {
            if (hub.get_room_count() == 0)
            {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i)
            {
                cout << "    " << i << ". " << hub.get_room(i).get_room_name() << endl;
            }
            size_t ri;
            cout << "  Chon phong (so): ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count())
            {
                cout << "  !! Phong khong hop le." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            if (room.get_device_count() == 0)
            {
                cout << "  !! Phong nay chua co thiet bi." << endl;
                continue;
            }
            cout << "  Danh sach thiet bi:" << endl;
            for (size_t j = 0; j < room.get_device_count(); ++j)
            {
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            }
            size_t di;
            cout << "  Chon thiet bi (so): ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count())
            {
                cout << "  !! Thiet bi khong hop le." << endl;
                continue;
            }
            auto dev = room.get_device(di);
            auto sl = dynamic_pointer_cast<SmartLight>(dev);
            auto sa = dynamic_pointer_cast<SmartAC>(dev);
            auto sk = dynamic_pointer_cast<SmartLock>(dev);
            if (sl)
            {
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
                Logger::log("Chinh thong so: " + sl->get_info());
            }
            else if (sa)
            {
                double temp;
                cout << "  Nhap nhiet do moi (C): ";
                cin >> temp;
                cin.ignore();
                sa->set_temperature(temp);
                cout << "  >> " << sa->get_info() << endl;
                Logger::log("Chinh thong so: " + sa->get_info());
            }
            else if (sk)
            {
                string newpass;
                cout << "  Nhap mat khau moi: ";
                getline(cin, newpass);
                sk->set_passcode(newpass);
                cout << "  >> Da doi mat khau thanh cong." << endl;
                Logger::log("Doi mat khau: " + sk->get_name());
            }
        }
        else if (choice == 6)
        {
            if (hub.get_room_count() == 0)
            {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            for (size_t i = 0; i < hub.get_room_count(); ++i)
            {
                cout << "  Phong '" << hub.get_room(i).get_room_name()
                     << "': " << hub.get_room(i).getRoomPower() << "W" << endl;
            }
            cout << "  >> TONG DIEN NANG TOAN NHA: " << hub.getTotalPower() << "W"
                 << endl;
        }
        else if (choice == 7)
        {
            if (hub.get_room_count() == 0)
            {
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
            if (r1 >= hub.get_room_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            for (size_t j = 0; j < hub.get_room(r1).get_device_count(); ++j)
                cout << "    " << j << ". "
                     << hub.get_room(r1).get_device(j)->get_name() << endl;
            cout << "  Thiet bi: ";
            cin >> d1;
            if (d1 >= hub.get_room(r1).get_device_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            cout << "  --- Chon thiet bi thu 2 ---" << endl;
            size_t r2, d2;
            cout << "  Phong: ";
            cin >> r2;
            if (r2 >= hub.get_room_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            for (size_t j = 0; j < hub.get_room(r2).get_device_count(); ++j)
                cout << "    " << j << ". "
                     << hub.get_room(r2).get_device(j)->get_name() << endl;
            cout << "  Thiet bi: ";
            cin >> d2;
            cin.ignore();
            if (d2 >= hub.get_room(r2).get_device_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            auto &dev1 = *hub.get_room(r1).get_device(d1);
            auto &dev2 = *hub.get_room(r2).get_device(d2);
            double sum = dev1 + dev2;
            cout << "  " << dev1.get_name() << " + " << dev2.get_name() << " = "
                 << sum << "W" << endl;
        }
        else if (choice == 8)
        {
            if (hub.get_room_count() == 0)
            {
                cout << "  !! Chua co phong nao." << endl;
                continue;
            }
            cout << "  Danh sach phong:" << endl;
            for (size_t i = 0; i < hub.get_room_count(); ++i)
                cout << "    " << i + 1 << ". " << hub.get_room(i).get_room_name()
                     << endl;
            size_t ri;
            cout << "  Chon phong: ";
            cin >> ri;
            cin.ignore();
            if (ri >= hub.get_room_count())
            {
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
            if (di >= room.get_device_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            auto sk = dynamic_pointer_cast<SmartLock>(room.get_device(di));
            if (!sk)
            {
                cout << "  !! Thiet bi nay khong phai SmartLock." << endl;
                continue;
            }
            string code;
            cout << "  Nhap mat khau: ";
            getline(cin, code);
            try
            {
                bool ok = sk->unlock(code);
                cout << "  >> Ket qua: " << (ok ? "MO KHOA THANH CONG" : "SAI MAT KHAU")
                     << endl;
            }
            catch (const ConnectionException &e)
            {
                cout << "  !! EXCEPTION: " << e.what() << endl;
                Logger::log_error(e.what());
            }
        }
        else if (choice == 9)
        {
            if (hub.get_room_count() == 0)
            {
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
            if (ri >= hub.get_room_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            Room &room = hub.get_room(ri);
            if (room.get_device_count() == 0)
            {
                cout << "  !! Phong nay chua co thiet bi." << endl;
                continue;
            }
            for (size_t j = 0; j < room.get_device_count(); ++j)
                cout << "    " << j << ". " << room.get_device(j)->get_info() << endl;
            size_t di;
            cout << "  Chon thiet bi: ";
            cin >> di;
            cin.ignore();
            if (di >= room.get_device_count())
            {
                cout << "  !! Sai." << endl;
                continue;
            }
            int mode;
            cout << "  1-Mat ket noi  2-Khoi phuc ket noi: ";
            cin >> mode;
            cin.ignore();
            auto dev = room.get_device(di);
            if (mode == 1)
            {
                dev->set_online(false);
                cout << "  >> '" << dev->get_name() << "' da MAT KET NOI." << endl;
                Logger::log("Gia lap mat ket noi: " + dev->get_name());
            }
            else
            {
                dev->set_online(true);
                cout << "  >> '" << dev->get_name() << "' da KHOI PHUC ket noi."
                     << endl;
                Logger::log("Khoi phuc ket noi: " + dev->get_name());
            }
        }
        else if (choice == 10)
        {
            hub.saveStateToFile("home_data.txt");
            cout << "  >> Da xuat trang thai ra file 'home_data.txt'" << endl;
        }
        else
        {
            cout << "  !! Lua chon khong hop le. Vui long chon lai." << endl;
        }
    }
}

int main(int argc, char* argv[]) {
    if (argc == 1) {
        run_interactive_menu();
        return 0;
    }

    if (argc < 3) {
        cout << "{\"error\": \"Missing arguments\"}" << endl;
        return 1;
    }

    string action = "";
    for (int i = 1; i < argc; ++i) {
        if (string(argv[i]) == "--action" && i + 1 < argc) {
            action = argv[i+1];
        }
    }

    if (action == "route") {
        string start = "", end = "";
        for (int i = 1; i < argc; ++i) {
            if (string(argv[i]) == "--start" && i + 1 < argc) start = argv[i+1];
            if (string(argv[i]) == "--end" && i + 1 < argc) end = argv[i+1];
        }

        Logger::log("Routing request from " + start + " to " + end);

        FloorPlanGraph graph;
        graph.addEdge("Dock", "Hallway", 2.0);
        graph.addEdge("Hallway", "LivingRoom", 3.0);
        graph.addEdge("Hallway", "Kitchen", 4.0);
        graph.addEdge("LivingRoom", "Bedroom1", 5.0);
        graph.addEdge("Kitchen", "Bedroom2", 6.0);

        auto path = graph.findShortestPath(start, end);

        if (path.empty()) {
            Logger::log_error("Route not found from " + start + " to " + end);
        } else {
            Logger::log("Route found successfully");
        }

        cout << "{ \"status\": \"success\", \"path\": [";
        for (size_t i = 0; i < path.size(); ++i) {
            cout << "\"" << path[i] << "\"";
            if (i < path.size() - 1) cout << ", ";
        }
        cout << "] }" << endl;
    }
    else if (action == "power") {
        string devices_str = "";
        for (int i = 1; i < argc; ++i) {
            if (string(argv[i]) == "--devices" && i + 1 < argc) devices_str = argv[i+1];
        }

        Logger::log("Power calculation request received.");
        SmartHomeHub hub("Main Hub");
        Room defaultRoom("Default Room");

        auto device_list = split(devices_str, ';');
        int device_count = 0;
        for (const auto& dev_str : device_list) {
            if (dev_str.empty()) continue;
            auto props = split(dev_str, ',');
            if (props.size() < 4) continue;

            string type = props[0];
            double bp = stod(props[1]);
            bool status = stoi(props[2]);
            double param = stod(props[3]);

            std::shared_ptr<Device> dev;
            string dname = type + "_" + to_string(++device_count);
            if (type == "Light") dev = make_shared<SmartLight>("", dname, bp, status, (int)param);
            else if (type == "AC") dev = make_shared<SmartAC>("", dname, bp, status, param);
            else if (type == "Lock") dev = make_shared<SmartLock>("", dname, bp, status);

            if (dev) {
                defaultRoom.addDevice(dev);
            }
        }

        hub.addRoom(defaultRoom);
        double total_power = hub.getTotalPower();

        Logger::log("Power calculation completed. Total: " + to_string(total_power) + "W");
        cout << "{ \"status\": \"success\", \"total_power\": " << fixed << setprecision(2) << total_power << " }" << endl;
    }
    else {
        Logger::log_error("Unknown action requested.");
        cout << "{\"error\": \"Unknown action\"}" << endl;
    }

    return 0;
}
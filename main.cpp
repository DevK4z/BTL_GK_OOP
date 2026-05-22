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

using namespace std;

class Device {
protected:
    std::string id_;
    std::string name_;
    bool status_;
    double base_power_;

public:
    Device(const std::string &id, const std::string &name, double base_power, bool status)
        : id_(id), name_(name), status_(status), base_power_(base_power) {}
    virtual ~Device() = default;
    virtual double get_power_consumption() = 0;
};

class SmartLight : public Device {
private:
    int brightness_;
public:
    SmartLight(const std::string &id, const std::string &name, double base_power, bool status, int brightness)
        : Device(id, name, base_power, status), brightness_(brightness) {}
    double get_power_consumption() override {
        if (!status_) return 0.0;
        return base_power_ * (brightness_ / 100.0);
    }
};

class SmartAC : public Device {
private:
    double temperature_;
public:
    SmartAC(const std::string &id, const std::string &name, double base_power, bool status, double temperature)
        : Device(id, name, base_power, status), temperature_(temperature) {}
    double get_power_consumption() override {
        if (!status_) return 0.0;
        return base_power_ * (1.0 + std::abs(temperature_ - 25.0) * 0.05);
    }
};

class SmartLock : public Device {
public:
    SmartLock(const std::string &id, const std::string &name, double base_power, bool status)
        : Device(id, name, base_power, status) {}
    double get_power_consumption() override {
        return status_ ? base_power_ : 0.0;
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

int main(int argc, char* argv[]) {
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

        FloorPlanGraph graph;
        graph.addEdge("Dock", "Hallway", 2.0);
        graph.addEdge("Hallway", "LivingRoom", 3.0);
        graph.addEdge("Hallway", "Kitchen", 4.0);
        graph.addEdge("LivingRoom", "Bedroom1", 5.0);
        graph.addEdge("Kitchen", "Bedroom2", 6.0);

        auto path = graph.findShortestPath(start, end);

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

        double total_power = 0.0;
        auto device_list = split(devices_str, ';');
        for (const auto& dev_str : device_list) {
            if (dev_str.empty()) continue;
            auto props = split(dev_str, ',');
            if (props.size() < 4) continue;

            string type = props[0];
            double bp = stod(props[1]);
            bool status = stoi(props[2]);
            double param = stod(props[3]);

            std::shared_ptr<Device> dev;
            if (type == "Light") dev = make_shared<SmartLight>("", "", bp, status, (int)param);
            else if (type == "AC") dev = make_shared<SmartAC>("", "", bp, status, param);
            else if (type == "Lock") dev = make_shared<SmartLock>("", "", bp, status);

            if (dev) total_power += dev->get_power_consumption();
        }

        cout << "{ \"status\": \"success\", \"total_power\": " << fixed << setprecision(2) << total_power << " }" << endl;
    }
    else {
        cout << "{\"error\": \"Unknown action\"}" << endl;
    }

    return 0;
}
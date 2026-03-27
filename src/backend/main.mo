import Map "mo:core/Map";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization logic
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // --------------- USER PROFILE ---------------
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // --------------- DATA MODELS ---------------
  // SmokingLog
  type SmokingLog = {
    id : Nat;
    date : Text; // ISO date string (YYYY-MM-DD)
    cigarettesCount : Nat;
    pricePerUnit : Float;
    totalSpent : Float;
    timestamp : Int;
  };

  module SmokingLog {
    public func compare(log1 : SmokingLog, log2 : SmokingLog) : Order.Order {
      Nat.compare(log1.id, log2.id);
    };
  };

  // UserSettings
  type UserSettings = {
    pricePerCigarette : Float;
    dailyLimitGoal : Nat;
    notificationsEnabled : Bool;
  };

  module UserSettings {
    public func compare(settings1 : UserSettings, settings2 : UserSettings) : Order.Order {
      switch (Float.compare(settings1.pricePerCigarette, settings2.pricePerCigarette)) {
        case (#equal) {
          switch (Nat.compare(settings1.dailyLimitGoal, settings2.dailyLimitGoal)) {
            case (#equal) { Bool.compare(settings1.notificationsEnabled, settings2.notificationsEnabled) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  // --------------- FACTORIES ---------------
  // Default UserSettings factory
  func defaultSettings() : UserSettings {
    {
      pricePerCigarette = 15.0;
      dailyLimitGoal = 10;
      notificationsEnabled = true;
    };
  };

  // --------------- STORAGE ---------------
  // User data store
  type UserData = {
    var nextId : Nat;
    var settings : UserSettings;
    logs : Map.Map<Nat, SmokingLog>;
  };

  let usersData = Map.empty<Principal, UserData>();

  func getUserData(caller : Principal) : UserData {
    switch (usersData.get(caller)) {
      case (?userData) { userData };
      case (null) {
        let newUserData : UserData = {
          var nextId = 1;
          var settings = defaultSettings();
          logs = Map.empty<Nat, SmokingLog>();
        };
        usersData.add(caller, newUserData);
        newUserData;
      };
    };
  };

  // --------------- LOGIC ---------------
  // Add log (returns the created log)
  public shared ({ caller }) func addLog(date : Text, cigarettesCount : Nat, pricePerUnit : Float) : async SmokingLog {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add logs");
    };

    let userData = getUserData(caller);

    let id = userData.nextId;
    userData.nextId += 1;

    let totalSpent = cigarettesCount.toFloat() * pricePerUnit;
    let timestamp = Time.now();

    let log : SmokingLog = {
      id;
      date;
      cigarettesCount;
      pricePerUnit;
      totalSpent;
      timestamp;
    };

    userData.logs.add(id, log);
    log;
  };

  // Get all logs (sorted by timestamp desc)
  public query ({ caller }) func getLogs() : async [SmokingLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    let userData = getUserData(caller);
    let logsList = List.fromIter<SmokingLog>(userData.logs.values());
    logsList.toArray().reverse();
  };

  // Delete log by id, returns deleted log
  public shared ({ caller }) func deleteLog(id : Nat) : async SmokingLog {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete logs");
    };

    let userData = getUserData(caller);
    switch (userData.logs.get(id)) {
      case (null) { Runtime.trap("Log not found") };
      case (?log) {
        userData.logs.remove(id);
        log;
      };
    };
  };

  // Get user settings (returns defaults if not set)
  public query ({ caller }) func getSettings() : async UserSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view settings");
    };

    let userData = getUserData(caller);
    userData.settings;
  };

  // Save user settings
  public shared ({ caller }) func saveSettings(settings : UserSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save settings");
    };

    let userData = getUserData(caller);
    userData.settings := settings;
  };
};

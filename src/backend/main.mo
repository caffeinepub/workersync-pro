import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type UserRole = AccessControl.UserRole;

  module User {
    public type Status = {
      #online;
      #offline;
    };

    public type Role = {
      #owner;
      #worker;
      #driver;
    };

    public type Profile = {
      id : Text;
      name : Text;
      role : Role;
      status : Status;
      lastSeen : Int;
    };
  };

  module Task {
    public type Status = {
      #pending;
      #accepted;
      #inProgress;
      #completed;
      #rejected;
    };

    public type Task = {
      id : Text;
      title : Text;
      description : Text;
      assignedTo : Principal;
      assignedBy : Principal;
      status : Status;
      date : Int;
      pickupLocation : Text;
      dropLocation : Text;
    };

    public func compare(task1 : Task, task2 : Task) : Order.Order {
      Text.compare(task1.id, task2.id);
    };
  };

  module Message {
    public type MessageType = {
      #text;
      #image;
      #document;
    };

    public type Message = {
      id : Text;
      sender : Principal;
      receiver : Principal;
      content : Text;
      timestamp : Int;
      messageType : MessageType;
      fileUrl : ?Storage.ExternalBlob;
    };
  };

  module Location {
    public type Location = {
      latitude : Int;
      longitude : Int;
      timestamp : Int;
      isSharing : Bool;
    };
  };

  module LogEntry {
    public type LogEntry = {
      id : Text;
      userId : Principal;
      action : Text;
      details : Text;
      timestamp : Int;
    };
  };

  // State
  let users = Map.empty<Principal, User.Profile>();
  let tasks = Map.empty<Text, Task.Task>();
  let messages = Map.empty<Text, Message.Message>();
  let locations = Map.empty<Principal, Location.Location>();
  let logs = Map.empty<Text, LogEntry.LogEntry>();

  // Helper Functions
  public type RegisterUserInput = {
    id : Text;
    name : Text;
    role : User.Role;
  };

  func getCurrentTimestamp() : Int {
    Time.now() / 1_000_000;
  };

  // Required profile functions for frontend
  public query ({ caller }) func getCallerUserProfile() : async ?User.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?User.Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or be an admin");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : User.Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  // User Functions
  public shared ({ caller }) func registerUser(user : RegisterUserInput) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can register users");
    };
    if (users.containsKey(caller)) {
      Runtime.trap("User with this principal already exists");
    };
    let newUser : User.Profile = {
      id = user.id;
      name = user.name;
      role = user.role;
      status = #offline;
      lastSeen = getCurrentTimestamp();
    };
    users.add(caller, newUser);
  };

  public shared ({ caller }) func updateMyStatus(status : User.Status) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update status");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User profile not found. Please register first."); };
      case (?user) {
        users.add(caller, { user with status });
      };
    };
  };

  public query ({ caller }) func getUser(user : Principal) : async User.Profile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view user profiles");
    };
    switch (users.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?user) { user };
    };
  };

  // Task Functions
  public shared ({ caller }) func createTask(taskInput : Task.Task) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };
    let taskId = "task-".concat(Nat.toText(tasks.size() + 1)).concat("-".concat(Int.toText(getCurrentTimestamp())));
    let newTask : Task.Task = {
      taskInput with
      id = taskId;
      status = #pending;
      assignedBy = caller;
      date = getCurrentTimestamp();
    };
    tasks.add(taskId, newTask);
    taskId;
  };

  public shared ({ caller }) func updateTaskStatus(taskId : Text, newStatus : Task.Status) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update task status");
    };
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        // Only the assignee or the assigner can update the task status
        if (task.assignedTo != caller and task.assignedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the assigned user, assigner, or admin can update task status");
        };
        tasks.add(taskId, { task with status = newStatus });
      };
    };
  };

  public query ({ caller }) func getTask(taskId : Text) : async Task.Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    switch (tasks.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        // Only the assignee, assigner, or admin can view the task
        if (task.assignedTo != caller and task.assignedBy != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the assigned user, assigner, or admin can view this task");
        };
        task;
      };
    };
  };

  public query ({ caller }) func getMyTasks() : async [Task.Task] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };
    tasks.values().toArray().filter<Task.Task>(func(task) { task.assignedTo == caller or task.assignedBy == caller });
  };

  public query ({ caller }) func getAllTasks() : async [Task.Task] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all tasks");
    };
    tasks.values().toArray().sort();
  };

  // Message Functions
  public shared ({ caller }) func sendMessage(receiver : Principal, content : Text, messageType : Message.MessageType, fileUrl : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    let messageId = "msg-".concat(Nat.toText(messages.size() + 1)).concat("-".concat(Int.toText(getCurrentTimestamp())));
    let newMessage : Message.Message = {
      id = messageId;
      sender = caller;
      receiver;
      content;
      timestamp = getCurrentTimestamp();
      messageType;
      fileUrl;
    };
    messages.add(messageId, newMessage);
  };

  public query ({ caller }) func getMessagesWithUser(user : Principal) : async [Message.Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    messages.values().toArray().filter<Message.Message>(func(msg) { 
      (msg.sender == caller and msg.receiver == user) or (msg.sender == user and msg.receiver == caller) 
    });
  };

  // Location Functions
  public shared ({ caller }) func updateMyLocation(latitude : Int, longitude : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update locations");
    };
    let currentLocation = switch (locations.get(caller)) {
      case (null) { { latitude = 0; longitude = 0; timestamp = 0; isSharing = true } };
      case (?loc) { loc };
    };
    let newLocation : Location.Location = {
      latitude;
      longitude;
      timestamp = getCurrentTimestamp();
      isSharing = currentLocation.isSharing;
    };
    locations.add(caller, newLocation);
  };

  public shared ({ caller }) func toggleLocationSharing(isSharing : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can toggle location sharing");
    };
    switch (locations.get(caller)) {
      case (null) {
        let newLocation : Location.Location = {
          latitude = 0;
          longitude = 0;
          timestamp = getCurrentTimestamp();
          isSharing;
        };
        locations.add(caller, newLocation);
      };
      case (?location) {
        locations.add(caller, { location with isSharing });
      };
    };
  };

  public query ({ caller }) func getUserLocation(user : Principal) : async Location.Location {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view locations");
    };
    switch (locations.get(user)) {
      case (null) { Runtime.trap("Location not found") };
      case (?location) {
        // Only allow viewing if location sharing is enabled or if caller is admin or the user themselves
        if (not location.isSharing and user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: User has disabled location sharing");
        };
        location;
      };
    };
  };

  // Activity Log Functions
  public shared ({ caller }) func addLog(action : Text, details : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add log entries");
    };
    let logId = "log-".concat(Nat.toText(logs.size() + 1)).concat("-".concat(Int.toText(getCurrentTimestamp())));
    let newLog : LogEntry.LogEntry = {
      id = logId;
      userId = caller;
      action;
      details;
      timestamp = getCurrentTimestamp();
    };
    logs.add(logId, newLog);
  };

  public query ({ caller }) func getUserLogs(user : Principal) : async [LogEntry.LogEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };
    // Only allow viewing own logs or admin can view any logs
    if (user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own logs or be an admin");
    };
    logs.values().toArray().filter<LogEntry.LogEntry>(func(log) { log.userId == user });
  };

  public query ({ caller }) func getAllLogs() : async [LogEntry.LogEntry] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all logs");
    };
    logs.values().toArray();
  };

  // Analytics Functions (Admin only)
  public query ({ caller }) func getTaskStats() : async { total : Nat; pending : Nat; completed : Nat; inProgress : Nat } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view task statistics");
    };
    let allTasks = tasks.values().toArray();
    let pending = allTasks.filter(func(t) { 
      switch (t.status) { case (#pending) { true }; case (_) { false } }
    }).size();
    let completed = allTasks.filter(func(t) { 
      switch (t.status) { case (#completed) { true }; case (_) { false } }
    }).size();
    let inProgress = allTasks.filter(func(t) { 
      switch (t.status) { case (#inProgress) { true }; case (_) { false } }
    }).size();
    {
      total = allTasks.size();
      pending;
      completed;
      inProgress;
    };
  };

  public query ({ caller }) func getActiveWorkerCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view worker statistics");
    };
    users.values().toArray().filter<User.Profile>(func(u) { 
      switch (u.status) { case (#online) { true }; case (_) { false } }
    }).size();
  };

  //Broadcast message (Admin only)
  public shared ({ caller }) func broadcastMessage(receivers : [Principal], content : Text, messageType : Message.MessageType, fileUrl : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can broadcast messages");
    };
    let timestamp = getCurrentTimestamp();
    for (receiver in receivers.vals()) {
      let messageId = "msg-".concat(Nat.toText(messages.size() + 1)).concat("-".concat(Int.toText(timestamp)));
      let newMessage : Message.Message = {
        id = messageId;
        sender = caller;
        receiver;
        content;
        timestamp;
        messageType;
        fileUrl;
      };
      messages.add(messageId, newMessage);
    };
  };

  // Image and Document Management
  public shared ({ caller }) func uploadFile(name : Text, fileType : Text, fileReference : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload files");
    };
    messages.add("file-".concat(name).concat("-").concat(fileType), {
      id = "file-".concat(name);
      sender = caller;
      receiver = caller;
      content = name;
      timestamp = getCurrentTimestamp();
      messageType = switch (fileType == "image", fileType == "document") {
        case (true, _) { #image };
        case (_, true) { #document };
        case (_) { #text };
      };
      fileUrl = ?fileReference;
    });
  };

  public query ({ caller }) func getFiles(fileType : Message.MessageType) : async [Message.Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view files");
    };
    messages.values().toArray().filter(func(msg) { msg.messageType == fileType });
  };

  public shared ({ caller }) func deleteFile(fileId : Text) : async () {
    let file = messages.get(fileId);
    switch (file) {
      case (null) { Runtime.trap("File not found") };
      case (?file) {
        if (file.sender != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: You can only delete files you uploaded, or be an admin");
        };
        messages.remove(fileId);
      };
    };
  };
};

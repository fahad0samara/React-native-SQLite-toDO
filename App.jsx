import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
} from "react-native";
import * as SQLite from "expo-sqlite";
import {
  IconButton,
  Provider,
  Portal,
  Dialog,
  Button,
} from "react-native-paper";
import asyncAlert from "./asyncAlert";
import ModalSelector from "react-native-modal-selector"; // Import the ModalSelector library

import { Ionicons } from "@expo/vector-icons";
import ColorPicker from "./ColorPicker";

const db = SQLite.openDatabase("todo_app");

const TaskPriority = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const TaskCategory = {
  PERSONAL: "Personal",
  WORK: "Work",
  SHOPPING: "Shopping",
};

export default function App() {
  const [taskInputValue, setTaskInputValue] = useState("");
  const [dialog, setDialog] = useState({
    task: {},
    isVisible: false,
  });

//adding
  const [dialogADD, setDialogADD] = useState({
    task: {},
    isVisible: false,
    
  });




  const [tasks, setTasks] = useState([]);
  const [taskPriority, setTaskPriority] = useState(TaskPriority.MEDIUM);
  const [taskCategory, setTaskCategory] = useState(TaskCategory.PERSONAL);
  const [taskColor, setTaskColor] = useState("#FF5733"); // Default color
const [addTaskDialogVisible, setAddTaskDialogVisible] = useState(false);


  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists tasks (id integer primary key not null, uid text, task text, priority text, category text, completed integer, color text);"
      );
      tx.executeSql("select * from tasks", [], (_, { rows }) => {
        const tasks = rows._array.map((item) => ({
          uid: item.uid,
          task: item.task,
          priority: item.priority,
          category: item.category,
          completed: item.completed === 1,
          color: item.color || "#FF5733",
          showActions: false, // New property for showing actions
        }));
        setTasks(tasks);
      });
    });
  }, []);

  const showDialog = (task) =>
    setDialog({
      isVisible: true,
      task,
    });

  const hideDialog = (updatedTask) => {
    setDialog({
      isVisible: false,
      task: {},
    });
    const newTasks = tasks.map((task) => {
      if (task.uid !== updatedTask.uid) {
        return task;
      }
      return updatedTask;
    });

    setTasks(newTasks);

    db.transaction((tx) => {
      tx.executeSql(
        `update tasks set uid=?, task=?, priority=?, category=?, completed=?, color=? where uid=${updatedTask.uid}`,
        [
          updatedTask.uid,
          updatedTask.task,
          updatedTask.priority,
          updatedTask.category,
          updatedTask.completed ? 1 : 0,
          updatedTask.color,
        ]
      );
    });
  };

  const deleteTask = async (task) => {
    const shouldDelete = await asyncAlert({
      title: "Delete Task",
      message: `Are you sure you want to delete the task: "${task.task}"?`,
    });
    if (!shouldDelete) {
      return;
    }
    const newTasks = tasks.filter((t) => t.uid !== task.uid);
    setTasks(newTasks);

    db.transaction((tx) => {
      tx.executeSql("delete from tasks where uid = ?", [task.uid]);
    });
  };

  const toggleTaskCompletion = (task) => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
    };
    hideDialog(updatedTask);
  };

  const toggleTaskActions = (item) => {
    const updatedTasks = tasks.map((task) => {
      if (task.uid === item.uid) {
        return {
          ...task,
          showActions: !task.showActions,
        };
      } else {
        return {
          ...task,
          showActions: false,
        };
      }
    });
    setTasks(updatedTasks);
  };

  const showDialogADD = (task) => {
    setDialogADD({
      isVisible: true,
      task,
    });



   
    setAddTaskDialogVisible(true); // Show the Add Task dialog
  };

  const hideDialogADD = () => {
    setDialogADD({
      isVisible: false,
      task: {},
    });
  
    setAddTaskDialogVisible(false); // Hide the Add Task dialog
  }






 


  return (
    <Provider>
      <SafeAreaView style={styles.container}>
        <Portal>
          <Dialog
            visible={dialogADD.isVisible}
            onDismiss={() => hideDialogADD(dialogADD.task)}
            style={styles.dialog}
          >
            <Dialog.Title>Edit Task</Dialog.Title>
            <Dialog.Content>
              <View style={styles.input}>
                <TextInput
                  placeholder="Enter a new task"
                  value={taskInputValue}
                  onChangeText={(data) => setTaskInputValue(data)}
                  underlineColorAndroid="transparent"
                  style={styles.textInputStyle}
                />
              </View>
              {/* Priority Picker */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Select Priority:</Text>
                <ModalSelector
                  data={[
                    { key: TaskPriority.HIGH, label: "High" },
                    { key: TaskPriority.MEDIUM, label: "Medium" },
                    { key: TaskPriority.LOW, label: "Low" },
                  ]}
                  initValue={TaskPriority.MEDIUM}
                  onChange={(option) => setTaskPriority(option.key)}
                >
                  <TextInput
                    style={pickerStyles}
                    editable={false}
                    value={taskPriority}
                  />
                </ModalSelector>
              </View>
              {/* Category Picker */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>Select Category:</Text>
                <ModalSelector
                  data={[
                    { key: TaskCategory.PERSONAL, label: "Personal" },
                    { key: TaskCategory.WORK, label: "Work" },
                    { key: TaskCategory.SHOPPING, label: "Shopping" },
                    // Add more categories as needed
                  ]}
                  initValue={TaskCategory.PERSONAL}
                  onChange={(option) => setTaskCategory(option.key)}
                >
                  <TextInput
                    style={pickerStyles}
                    editable={false}
                    value={taskCategory}
                  />
                </ModalSelector>
                <Text style={styles.label}>Select Color:</Text>
                <ColorPicker
                  selectedColor={taskColor}
                  onColorChange={setTaskColor}
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <TouchableOpacity
                disabled={!taskInputValue}
                onPress={() => {
                  const newTask = {
                    uid: Date.now().toString(),
                    task: taskInputValue,
                    priority: taskPriority,
                    category: taskCategory,
                    completed: false,
                    color: taskColor,
                    showActions: false, // Initial state for showing actions
                  };
                  setTasks([...tasks, newTask]);
                  db.transaction((tx) => {
                    tx.executeSql(
                      "insert into tasks (uid, task, priority, category, completed, color) values(?, ?, ?, ?, ?, ?)",
                      [
                        newTask.uid,
                        newTask.task,
                        newTask.priority,
                        newTask.category,
                        newTask.completed ? 1 : 0,
                        newTask.color,
                      ]
                    );
                  });
                  hideDialogADD();
                  setTaskInputValue("");
                }}
                style={styles.buttonStyle}
              >
                <Text style={styles.buttonTextStyle}>Add Task</Text>
              </TouchableOpacity>
              {/* Add Cancel button */}
              <Button
                
               onPress={() => hideDialogADD()}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => showDialogADD({})}
        >
          <Ionicons name="ios-add" size={36} color="white" />
        </TouchableOpacity>

        <Text style={styles.titleText}>To-Do List</Text>

        <View>
          <Text style={styles.taskList}>Tasks:</Text>
          <FlatList
            data={tasks}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.task,
                  {
                    backgroundColor: item.color,
                  },
                ]}
                onPress={() => toggleTaskActions(item)}
              >
                <View style={styles.taskInfo}>
                  <IconButton
                    icon={
                      item.completed
                        ? "checkbox-marked-circle-outline"
                        : "checkbox-blank-circle-outline"
                    }
                    size={20}
                    onPress={() => toggleTaskCompletion(item)}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.taskText,
                        item.completed && styles.completedTask,
                      ]}
                    >
                      {item.task}
                    </Text>
                  </View>
                  <View style={styles.icons}>
                    <>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => showDialog(item)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => deleteTask(item)}
                      />
                    </>
                  </View>
                </View>
                <View style={styles.taskDetailsContainer}>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <View
                  style={[
                    styles.colorIndicator,
                    {
                      backgroundColor: item.color,
                    },
                  ]}
                ></View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.uid.toString()}
          />
        </View>
      </SafeAreaView>
      <Portal>
        <Dialog
          visible={dialog.isVisible}
          onDismiss={() => hideDialog(dialog.task)}
        >
          <Dialog.Title>Edit Task</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={dialog.task.task}
              onChangeText={(text) =>
                setDialog((prev) => ({
                  ...prev,
                  task: {
                    ...prev.task,
                    task: text,
                  },
                }))
              }
              underlineColorAndroid="transparent"
              style={styles.textInputStyle}
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Select Priority:</Text>
              <ModalSelector
                data={[
                  { key: TaskPriority.HIGH, label: "High" },
                  { key: TaskPriority.MEDIUM, label: "Medium" },
                  { key: TaskPriority.LOW, label: "Low" },
                ]}
                initValue={dialog.task.priority}
                onChange={(option) =>
                  setDialog((prev) => ({
                    ...prev,
                    task: {
                      ...prev.task,
                      priority: option.key,
                    },
                  }))
                }
              >
                <TextInput
                  style={pickerStyles}
                  editable={false}
                  value={dialog.task.priority}
                />
              </ModalSelector>
              <Text style={styles.label}>Select Category:</Text>
              <ModalSelector
                data={[
                  { key: TaskCategory.PERSONAL, label: "Personal" },
                  { key: TaskCategory.WORK, label: "Work" },
                  { key: TaskCategory.SHOPPING, label: "Shopping" },
                  // Add more categories as needed
                ]}
                initValue={dialog.task.category}
                onChange={(option) =>
                  setDialog((prev) => ({
                    ...prev,
                    task: {
                      ...prev.task,
                      category: option.key,
                    },
                  }))
                }
              >
                <TextInput
                  style={pickerStyles}
                  editable={false}
                  value={dialog.task.category}
                />
              </ModalSelector>
              <Text style={styles.label}>Select Color:</Text>
              <ColorPicker
                selectedColor={dialog.task.color}
                onColorChange={(color) =>
                  setDialog((prev) => ({
                    ...prev,
                    task: {
                      ...prev.task,
                      color: color,
                    },
                  }))
                }
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => hideDialog(dialog.task)}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20, // Adjust this value as needed
    paddingHorizontal: 20, // Adjust this value a

    backgroundColor: "#F0F0F0",
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "teal",
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginHorizontal: 10,

    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    borderColor: "teal",
    borderWidth: 1.8,
    shadowOffset: { width: -5 },
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "teal",
    marginBottom: 5,
    marginHorizontal: 10,
  },

  task: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 10,
    height: Platform.OS === "android" ? 100 : 100 + StatusBar.currentHeight * 2,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 10,
    marginHorizontal: 10,

    shadowOffset: { width: -5 },
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 80,
  },
  taskInfo: {
    flexDirection: "row",
    alignItems: "center",
    color: "#fff",
  },
  taskDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
    marginHorizontal: 10,
  },

  taskText: {
    fontSize: 18,
    color: "#fff",
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "gray",
  },
  priorityText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
    color: "teal",
  },
  categoryText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "purple",
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 10,
  },
  buttonStyle: {
    fontSize: 18,
    color: "white",
    backgroundColor: "teal",
    padding: 15,
    marginTop: 20,
    minWidth: 200,
    marginBottom: 20,
    borderRadius: 8,
    alignSelf: "center",
  },
  buttonTextStyle: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
  textInputStyle: {
    flex: 1,
    fontSize: 18,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  taskList: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "teal",
  },
  dialog: {
    borderRadius: 10,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "teal",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowOffset: { width: 2, height: 2 },
    shadowColor: "black",
    shadowOpacity: 0.2,
    zIndex:9999 

  },

});

const pickerStyles = {
  fontSize: 18,
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderWidth: 1,
  borderColor: "teal",
  borderRadius: 10,
  color: "black",
  paddingRight: 30,
  marginBottom: 10,
  marginHorizontal: 10,
};

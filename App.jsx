import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';

import {
  SafeAreaView,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import {
  IconButton,
  Provider,
  Portal,
  Dialog,
  Button,
  Checkbox,
} from 'react-native-paper';
import asyncAlert from './asyncAlert';

const db = SQLite.openDatabase('todo_app');

const TaskPriority = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

const TaskCategory = {
  PERSONAL: 'Personal',
  WORK: 'Work',
  SHOPPING: 'Shopping',
};

export default function App() {
  const [taskInputValue, setTaskInputValue] = useState('');
  const [dialog, setDialog] = useState({
    task: {},
    isVisible: false,
  });
  const [tasks, setTasks] = useState([]);
  const [taskPriority, setTaskPriority] = useState(TaskPriority.MEDIUM);
  const [taskCategory, setTaskCategory] = useState(TaskCategory.PERSONAL);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'create table if not exists tasks (id integer primary key not null, uid text, task text, priority text, category text, completed integer);'
      );
      tx.executeSql('select * from tasks', [], (_, { rows }) => {
        const tasks = rows._array.map((item) => ({
          uid: item.uid,
          task: item.task,
          priority: item.priority,
          category: item.category,
          completed: item.completed === 1,
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
        `update tasks set uid=?, task=?, priority=?, category=?, completed=? where uid=${updatedTask.uid}`,
        [
          updatedTask.uid,
          updatedTask.task,
          updatedTask.priority,
          updatedTask.category,
          updatedTask.completed ? 1 : 0,
        ]
      );
    });
  };

  const deleteTask = async (task) => {
    const shouldDelete = await asyncAlert({
      title: 'Delete Task',
      message: `Are you sure you want to delete the task: "${task.task}"?`,
    });
    if (!shouldDelete) {
      return;
    }
    const newTasks = tasks.filter((t) => t.uid !== task.uid);
    setTasks(newTasks);

    db.transaction((tx) => {
      tx.executeSql('delete from tasks where uid = ?', [task.uid]);
    });
  };

  const toggleTaskCompletion = (task) => {
    const updatedTask = {
      ...task,
      completed: !task.completed,
    };
    hideDialog(updatedTask);
  };

  return (
    <Provider>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.titleText}>To-Do List</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter a new task"
              value={taskInputValue}
              onChangeText={(data) => setTaskInputValue(data)}
              underlineColorAndroid="transparent"
              style={styles.textInputStyle}
            />
           
          </View>
           <View style={styles.pickerContainer}>
              <Picker
                selectedValue={taskPriority}
                style={styles.picker}
                onValueChange={(itemValue) => setTaskPriority(itemValue)}
              >
                <Picker.Item label="High" value={TaskPriority.HIGH} />
                <Picker.Item label="Medium" value={TaskPriority.MEDIUM} />
                <Picker.Item label="Low" value={TaskPriority.LOW} />
              </Picker>
              <Picker
                selectedValue={taskCategory}
                style={styles.picker}
                onValueChange={(itemValue) => setTaskCategory(itemValue)}
              >
                <Picker.Item label="Personal" value={TaskCategory.PERSONAL} />
                <Picker.Item label="Work" value={TaskCategory.WORK} />
                <Picker.Item label="Shopping" value={TaskCategory.SHOPPING} />
                {/* Add more categories as needed */}
              </Picker>
            </View>

          <TouchableOpacity
            disabled={!taskInputValue}
            onPress={() => {
              const newTask = {
                uid: Date.now().toString(),
                task: taskInputValue,
                priority: taskPriority,
                category: taskCategory,
                completed: false,
              };
              setTasks([...tasks, newTask]);
              db.transaction((tx) => {
                tx.executeSql(
                  'insert into tasks (uid, task, priority, category, completed) values(?, ?, ?, ?, ?)',
                  [
                    newTask.uid,
                    newTask.task,
                    newTask.priority,
                    newTask.category,
                    newTask.completed ? 1 : 0,
                  ]
                );
              });
              setTaskInputValue('');
            }}
            style={styles.buttonStyle}
          >
            <Text style={styles.buttonTextStyle}>Add Task</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.taskList}>Tasks:</Text>
            <FlatList
              data={tasks}
              renderItem={({ item }) => (
                <View style={styles.task}>
                  <View style={styles.taskInfo}>
                    <Checkbox
                      status={item.completed ? 'checked' : 'unchecked'}
                      onPress={() => toggleTaskCompletion(item)}
                    />
                    <Text
                      style={[
                        styles.taskText,
                        item.completed && styles.completedTask,
                      ]}
                    >
                      {item.task}
                    </Text>
                  </View>
                  <Text style={styles.priorityText}>{item.priority}</Text>
                  <Text style={styles.categoryText}>{item.category}</Text>
                  <View style={styles.icons}>
                    <IconButton
                      icon="pencil"
                      size={24}
                      onPress={() => showDialog(item)}
                    />
                    <IconButton
                      icon="delete"
                      size={24}
                      onPress={() => deleteTask(item)}
                    />
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.uid.toString()}
            />
          </View>
        </View>
        <Portal>
          <Dialog visible={dialog.isVisible} onDismiss={() => hideDialog(dialog.task)}>
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
                <Picker
                  selectedValue={dialog.task.priority}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setDialog((prev) => ({
                      ...prev,
                      task: {
                        ...prev.task,
                        priority: itemValue,
                      },
                    }))
                  }
                >
                  <Picker.Item label="High" value={TaskPriority.HIGH} />
                  <Picker.Item label="Medium" value={TaskPriority.MEDIUM} />
                  <Picker.Item label="Low" value={TaskPriority.LOW} />
                </Picker>
                <Picker
                  selectedValue={dialog.task.category}
                  style={styles.picker}
                  onValueChange={(itemValue) =>
                    setDialog((prev) => ({
                      ...prev,
                      task: {
                        ...prev.task,
                        category: itemValue,
                      },
                    }))
                  }
                >
                  <Picker.Item label="Personal" value={TaskCategory.PERSONAL} />
                  <Picker.Item label="Work" value={TaskCategory.WORK} />
                  <Picker.Item label="Shopping" value={TaskCategory.SHOPPING} />
                  {/* Add more categories as needed */}
                </Picker>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => hideDialog(dialog.task)}>Done</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F0F0F0',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 20,
    color: 'teal',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:"red"
    


  },
  picker:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,

  


  },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskText: {
    fontSize: 18,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  priorityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    color: 'teal',
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'purple',
  },
  buttonStyle: {
    fontSize: 18,
    color: 'white',
    backgroundColor: 'teal',
    padding: 15,
    marginTop: 20,
    minWidth: 200,
    marginBottom: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonTextStyle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  textInputStyle: {
    height: 40,
    fontSize: 18,
    width: '45%',
    borderWidth: 1,
    borderColor: 'teal',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  priorityPicker: {
    width: '25%',
  },
  categoryPicker: {
    width: '25%',
  },
  icons: {
    flexDirection: 'row',
  },
  taskList: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'teal',
  },
});

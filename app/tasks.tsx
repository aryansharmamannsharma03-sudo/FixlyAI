import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "../supabase";

type Task = {
  id: string;
  title: string;
  category: string | null;
  priority: string | null;
  deadline: string | null;
  completed: boolean;
  created_at: string;
};

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTasks([]);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select(
          "id, title, category, priority, deadline, completed, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("TASK LOAD ERROR:", error);
        return;
      }

      setTasks(data || []);

      console.log("TASKS LOADED:", data?.length || 0);
    } catch (error) {
      console.log("TASK LOAD ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const toggleTask = async (task: Task) => {
    const newCompleted = !task.completed;

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, completed: newCompleted }
          : item
      )
    );

    const { error } = await supabase
      .from("tasks")
      .update({ completed: newCompleted })
      .eq("id", task.id);

    if (error) {
      console.log("TASK UPDATE ERROR:", error);

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, completed: task.completed }
            : item
        )
      );

      Alert.alert("Error", "Unable to update task.");
    }
  };

  const deleteTask = (task: Task) => {
    Alert.alert(
      "Delete task?",
      "This task will be permanently removed.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("tasks")
              .delete()
              .eq("id", task.id);

            if (error) {
              console.log("TASK DELETE ERROR:", error);
              Alert.alert("Error", "Unable to delete task.");
              return;
            }

            setTasks((current) =>
              current.filter((item) => item.id !== task.id)
            );
          },
        },
      ]
    );
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) {
      return "No deadline";
    }

    const date = new Date(deadline);

    if (Number.isNaN(date.getTime())) {
      return deadline;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getPriorityStyle = (priority: string | null) => {
    if (priority?.toLowerCase() === "high") {
      return styles.highPriority;
    }

    if (priority?.toLowerCase() === "medium") {
      return styles.mediumPriority;
    }

    return styles.lowPriority;
  };

  const renderTask = ({ item }: { item: Task }) => {
    return (
      <View
        style={[
          styles.taskCard,
          item.completed && styles.completedCard,
        ]}
      >
        <Pressable
          style={[
            styles.checkButton,
            item.completed && styles.checkedButton,
          ]}
          onPress={() => toggleTask(item)}
        >
          <Text style={styles.checkText}>
            {item.completed ? "✓" : ""}
          </Text>
        </Pressable>

        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              item.completed && styles.completedTitle,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View style={styles.metaRow}>
            {item.category ? (
              <Text style={styles.category}>
                {item.category}
              </Text>
            ) : null}

            {item.priority ? (
              <Text
                style={[
                  styles.priority,
                  getPriorityStyle(item.priority),
                ]}
              >
                {item.priority}
              </Text>
            ) : null}
          </View>

          <Text style={styles.deadline}>
            📅 {formatDeadline(item.deadline)}
          </Text>
        </View>

        <Pressable
          style={styles.deleteButton}
          onPress={() => deleteTask(item)}
        >
          <Text style={styles.deleteText}>×</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>✦ FIXLY AI</Text>

        <Text style={styles.title}>Tasks</Text>

        <Text style={styles.subtitle}>
          Keep track of problems that need your attention.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#16B8A6"
          />

          <Text style={styles.loadingText}>
            Loading your tasks...
          </Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>✓</Text>

          <Text style={styles.emptyTitle}>
            No tasks yet
          </Text>

          <Text style={styles.emptyText}>
            When Fixly AI detects something that needs
            to be done, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadTasks(true)}
              tintColor="#16B8A6"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 22,
  },

  badge: {
    color: "#16B8A6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 7,
  },

  subtitle: {
    color: "#8FA0B4",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#102235",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1D3A50",
  },

  completedCard: {
    opacity: 0.65,
  },

  checkButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#16B8A6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  checkedButton: {
    backgroundColor: "#16B8A6",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  taskContent: {
    flex: 1,
  },

  taskTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },

  completedTitle: {
    textDecorationLine: "line-through",
    color: "#7F91A6",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 8,
  },

  category: {
    color: "#8FA0B4",
    fontSize: 12,
  },

  priority: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  highPriority: {
    color: "#FF6B6B",
  },

  mediumPriority: {
    color: "#FFC857",
  },

  lowPriority: {
    color: "#16B8A6",
  },

  deadline: {
    color: "#71849A",
    fontSize: 12,
    marginTop: 7,
  },

  deleteButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  deleteText: {
    color: "#71849A",
    fontSize: 25,
    fontWeight: "300",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 70,
  },

  loadingText: {
    color: "#8FA0B4",
    fontSize: 14,
    marginTop: 12,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#102235",
    color: "#16B8A6",
    fontSize: 35,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 60,
    marginBottom: 18,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    color: "#7F91A6",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
});
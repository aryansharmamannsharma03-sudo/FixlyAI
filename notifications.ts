import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// =====================================================
// NOTIFICATION HANDLER
// App foreground में होने पर भी notification दिखाई दे
// =====================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// =====================================================
// ANDROID NOTIFICATION CHANNEL
// =====================================================

export async function setupNotifications() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        "fixly-reminders",
        {
          name: "Fixly AI Reminders",
          importance:
            Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: "default",
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        }
      );
    }

    const permissions =
      await Notifications.getPermissionsAsync();

    if (
      permissions.status !==
      Notifications.PermissionStatus.GRANTED
    ) {
      const requested =
        await Notifications.requestPermissionsAsync();

      if (
        requested.status !==
        Notifications.PermissionStatus.GRANTED
      ) {
        console.log(
          "NOTIFICATION PERMISSION DENIED"
        );

        return false;
      }
    }

    console.log(
      "NOTIFICATIONS READY"
    );

    return true;
  } catch (error) {
    console.log(
      "NOTIFICATION SETUP ERROR:",
      error
    );

    return false;
  }
}

// =====================================================
// SCHEDULE TASK REMINDER
// =====================================================

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  reminderDate: Date
) {
  try {
    const ready =
      await setupNotifications();

    if (!ready) {
      return null;
    }
    console.log(
  "REMINDER DATE:",
  reminderDate.toString()
);

console.log(
  "CURRENT DATE:",
  new Date().toString()
);
    // Past date को schedule मत करो
    if (
      reminderDate.getTime() <=
      Date.now()
    ) {
      console.log(
        "REMINDER DATE IS IN THE PAST"
      );

      return null;
    }

    const notificationId =
      await Notifications.scheduleNotificationAsync(
        {
          content: {
            title: "🔔 Fixly AI Reminder",
            body: title,
            sound: "default",
            data: {
              taskId,
              type: "task-reminder",
            },
          },

          trigger: {
            type:
              Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderDate,
            ...(Platform.OS === "android"
              ? {
                  channelId:
                    "fixly-reminders",
                }
              : {}),
          },
        }
      );

    console.log(
      "REMINDER SCHEDULED:",
      notificationId
    );

    return notificationId;
  } catch (error) {
    console.log(
      "REMINDER SCHEDULE ERROR:",
      error
    );

    return null;
  }
}

// =====================================================
// CANCEL TASK REMINDER
// =====================================================

export async function cancelTaskReminder(
  notificationId: string
) {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificationId
    );

    console.log(
      "REMINDER CANCELLED:",
      notificationId
    );

    return true;
  } catch (error) {
    console.log(
      "REMINDER CANCEL ERROR:",
      error
    );

    return false;
  }
}

// =====================================================
// SHOW ALL SCHEDULED REMINDERS
// DEBUG / TESTING
// =====================================================

export async function getScheduledReminders() {
  try {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();

    console.log(
      "SCHEDULED REMINDERS:",
      notifications
    );

    return notifications;
  } catch (error) {
    console.log(
      "GET REMINDERS ERROR:",
      error
    );

    return [];
  }
}
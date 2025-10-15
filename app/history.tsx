import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "@/utils/storage";

type Expense = {
  id: string | number;
  name: string;
  categoryName: string;
  amount: number;
  date: string;
};

type Deposit = {
  id: string | number;
  categoryName: string;
  amount: number;
  date: string;
};

type TabType = 'expenses' | 'deposits';

type HistoryState = {
  expenses: Expense[];
  deposits: Deposit[];
};

export default function History() {
  const { expenses, deposits } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('expenses');
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const expenseList: Expense[] =
    typeof expenses === "string" && expenses
      ? JSON.parse(expenses)
      : [];

  const depositList: Deposit[] =
    typeof deposits === "string" && deposits
      ? JSON.parse(deposits)
      : [];

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const savedHistory = await storage.getItem<HistoryState[]>('transaction_history');
    if (savedHistory && savedHistory.length > 0) {
      setHistory(savedHistory);
      setCurrentIndex(savedHistory.length - 1);
    } else {
      const initialState = { expenses: expenseList, deposits: depositList };
      setHistory([initialState]);
      setCurrentIndex(0);
      await storage.setItem('transaction_history', [initialState]);
    }
  };

  const saveToHistory = async (newState: HistoryState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);

    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    await storage.setItem('transaction_history', newHistory);
  };

  const undo = async () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const previousState = history[newIndex];

      await storage.setItem('expenses', previousState.expenses);
      await storage.setItem('deposits', previousState.deposits);

      router.back();
    }
  };

  const redo = async () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const nextState = history[newIndex];

      await storage.setItem('expenses', nextState.expenses);
      await storage.setItem('deposits', nextState.deposits);

      router.back();
    }
  };

  const clearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all expenses and deposits? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await storage.removeItem('expenses');
            await storage.removeItem('deposits');
            await storage.removeItem('transaction_history');

            setHistory([]);
            setCurrentIndex(-1);

            router.back();
          }
        }
      ]
    );
  };

  const currentExpenses = currentIndex >= 0 ? history[currentIndex]?.expenses || expenseList : expenseList;
  const currentDeposits = currentIndex >= 0 ? history[currentIndex]?.deposits || depositList : depositList;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, currentIndex <= 0 && styles.disabledButton]}
          onPress={undo}
          disabled={currentIndex <= 0}
        >
          <Ionicons name="arrow-undo" size={20} color={currentIndex <= 0 ? "#ccc" : "#cc6c0cff"} />
          <Text style={[styles.buttonText, currentIndex <= 0 && styles.disabledText]}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, currentIndex >= history.length - 1 && styles.disabledButton]}
          onPress={redo}
          disabled={currentIndex >= history.length - 1}
        >
          <Ionicons name="arrow-redo" size={20} color={currentIndex >= history.length - 1 ? "#ccc" : "#cc6c0cff"} />
          <Text style={[styles.buttonText, currentIndex >= history.length - 1 && styles.disabledText]}>Redo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={clearAllData}
        >
          <Ionicons name="trash" size={20} color="#e74c3c" />
          <Text style={[styles.buttonText, styles.clearButtonText]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Ionicons
            name="cash-outline"
            size={18}
            color={activeTab === 'expenses' ? "#fff" : "#cc6c0cff"}
          />
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'deposits' && styles.activeTab]}
          onPress={() => setActiveTab('deposits')}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={activeTab === 'deposits' ? "#fff" : "#cc6c0cff"}
          />
          <Text style={[styles.tabText, activeTab === 'deposits' && styles.activeTabText]}>
            Deposits
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {activeTab === 'expenses' ? (
          currentExpenses.length === 0 ? (
            <Text style={styles.empty}>No expenses recorded yet.</Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>Category</Text>
                <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>Expense</Text>
                <Text style={[styles.cell, styles.headerCell, { flex: 1 }]}>Amount</Text>
                <Text style={[styles.cell, styles.headerCell, { flex: 1.7 }]}>Date</Text>
              </View>

              {currentExpenses.map((exp: Expense) => (
                <View key={exp.id} style={styles.row}>
                  <Text
                    style={[styles.cell, { flex: 1.5 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    {exp.categoryName}
                  </Text>
                  <Text
                    style={[styles.cell, { flex: 1.5 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    {exp.name}
                  </Text>
                  <Text
                    style={[styles.cell, { flex: 1 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    ₱{exp.amount.toFixed(2)}
                  </Text>
                  <Text
                    style={[styles.cell, { flex: 1.7 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    {exp.date}
                  </Text>
                </View>
              ))}
            </View>
          )
        ) : (
          currentDeposits.length === 0 ? (
            <Text style={styles.empty}>No deposits recorded yet.</Text>
          ) : (
            <View style={styles.table}>
              <View style={[styles.row, styles.headerRow]}>
                <Text style={[styles.cell, styles.headerCell, { flex: 2 }]}>Category</Text>
                <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}>Amount</Text>
                <Text style={[styles.cell, styles.headerCell, { flex: 1.7 }]}>Date</Text>
              </View>

              {currentDeposits.map((dep: Deposit) => (
                <View key={dep.id} style={styles.row}>
                  <Text
                    style={[styles.cell, { flex: 2 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    {dep.categoryName}
                  </Text>
                  <Text
                    style={[styles.cell, { flex: 1.5, color: '#27ae60' }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    ₱{dep.amount.toFixed(2)}
                  </Text>
                  <Text
                    style={[styles.cell, { flex: 1.7 }]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.8}
                  >
                    {dep.date}
                  </Text>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fef8f4",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#cc6c0cff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cc6c0cff",
    gap: 6,
  },
  disabledButton: {
    borderColor: "#ddd",
    backgroundColor: "#f5f5f5",
  },
  clearButton: {
    borderColor: "#e74c3c",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cc6c0cff",
  },
  disabledText: {
    color: "#ccc",
  },
  clearButtonText: {
    color: "#e74c3c",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cc6c0cff",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#cc6c0cff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cc6c0cff",
  },
  activeTabText: {
    color: "#fff",
  },
  empty: {
    textAlign: "center",
    color: "gray",
    fontSize: 14,
    marginTop: 20,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  headerRow: {
    backgroundColor: "#cc6c0cff",
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    textAlign: "center",
    fontSize: 13,
  },
  headerCell: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
});

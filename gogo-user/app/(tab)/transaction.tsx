import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useGetPaymentHistoryQuery } from "../../Redux/api/paymentApi";
import { Colors } from "../../constants/Colors";
import { getPaymentArray, toTransactionItem } from "../../utils/paymentFormatters";

export default function TransactionScreen() {
  const { data, isError, isFetching, refetch } = useGetPaymentHistoryQuery({
    page: 1,
    limit: 50,
  });
  const filteredTransactions = getPaymentArray(data).map(toTransactionItem);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Animated.Text
          entering={FadeInUp.delay(100).duration(600)}
          style={styles.title}
        >
          Transactions
        </Animated.Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {isFetching && filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primaryDark} />
          </View>
        )}

        {isError && filteredTransactions.length === 0 && (
          <TouchableOpacity
            style={styles.emptyState}
            onPress={refetch}
            activeOpacity={0.7}
          >
            <Ionicons name="receipt-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyMessage}>There is no transaction yet</Text>
          </TouchableOpacity>
        )}

        {filteredTransactions.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(300 + index * 50).duration(600)}
          >
            <TouchableOpacity
              style={styles.transactionItem}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={item.color}
                />
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionType}>{item.type}</Text>
                <Text style={styles.transactionDesc}>{item.desc}</Text>
                <Text style={styles.transactionDate}>
                  {item.date} - {item.time}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  { color: item.type === "Refund" ? "#4CAF50" : Colors.text },
                ]}
              >
                {item.amount}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}

        {!isFetching && !isError && filteredTransactions.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyMessage}>There is no transaction yet</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#abffaf",
    color: "#000",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    height: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardLabel: {
    color: "#000",
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "500",
  },
  cardAmount: {
    color: "#000",
    fontSize: 28,
    fontWeight: "800",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
  },
  filterTextActive: {
    color: "#000",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  transactionDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#999",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 40,
  },
});

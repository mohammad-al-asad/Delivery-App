import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { PaymentSuccessModal } from "../../../components/PaymentSuccessModal";
import { Colors } from "../../../constants/Colors";
import { useCreateOrderMutation } from "../../../Redux/api/orderApi";
import {
  useInitiatePaymentMutation,
  useVerifyPaymentMutation,
} from "../../../Redux/api/paymentApi";
import { useAppDispatch } from "../../../Redux/hooks";
import { resetOrderDraft } from "../../../Redux/Slice/orderDraftSlice";

const STEPS = ["Locations", "Vehicle", "Checkout", "Payment"];

const PAYMENT_METHODS = [
  { id: "card", name: "Online Card Payment (Stripe)", balance: null, icon: "card-outline" },
  // Cash on Delivery is disabled for now
  // { id: "cash", name: "Cash on Delivery", balance: null, icon: "cash-outline" },
];

export default function PaymentScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    orderPayload: string;
    amount: string;
  }>();
  const orderPayloadRaw = params.orderPayload;
  const amount = params.amount;

  const currentStep = 3;
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionUrl, setTransactionUrl] = useState<string | null>(null);
  const [currentChargeId, setCurrentChargeId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const [createOrder] = useCreateOrderMutation();

  const totalAmount = amount ? parseFloat(amount) : 39.82;
  const subtotal = (totalAmount / 1.15).toFixed(2);
  const serviceFee = (parseFloat(subtotal) * 0.08).toFixed(2);
  const tax = (
    totalAmount -
    parseFloat(subtotal) -
    parseFloat(serviceFee)
  ).toFixed(2);

  const [initiatePayment, { isLoading: isInitiating }] =
    useInitiatePaymentMutation();
  const [verifyPayment, { isLoading: isVerifying }] =
    useVerifyPaymentMutation();

  const handlePayment = async () => {
    if (!orderPayloadRaw) {
      Alert.alert("Error", "Order details are missing");
      return;
    }

    setIsProcessing(true);
    try {
      const orderPayload = JSON.parse(orderPayloadRaw);

      // Step 1: Create Order
      const orderResponse = await createOrder({
        ...orderPayload,
        paymentMethod: selectedMethod === "cash" ? "Cash" : "Card",
      }).unwrap();

      if (!orderResponse.success || !orderResponse.data?._id) {
        throw new Error(orderResponse.message || "Failed to create order");
      }

      const orderId = orderResponse.data._id;
      setCreatedOrderId(orderId);

      if (selectedMethod === "cash") {
        setShowSuccessModal(true);
        return;
      }

      const result = await initiatePayment({
        orderId,
        amount: amount ? parseFloat(amount) : undefined,
      }).unwrap();

      if (result.data?.clientSecret) {
        setCurrentChargeId(result.data.paymentIntentId);
        const pk =
          result.data.publishableKey ||
          process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
          "pk_test_placeholder";
        
        // Generate secure Stripe Elements checkout HTML
        const stripeHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
              <script src="https://js.stripe.com/v3/"></script>
              <style>
                * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                body { margin: 0; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; min-height: 100vh; }
                .card-box { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
                .title { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
                .amount-tag { font-size: 24px; font-weight: 800; color: #2D8C3C; margin-bottom: 20px; }
                #payment-element { margin-bottom: 24px; }
                button { background: #2D8C3C; color: white; border: none; border-radius: 12px; width: 100%; padding: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
                button:disabled { opacity: 0.6; cursor: not-allowed; }
                #error-message { color: #dc2626; font-size: 14px; margin-top: 12px; text-align: center; }
                .badge { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 18px; font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="card-box">
                <div class="title">Complete Payment</div>
                <div class="amount-tag">AED ${totalAmount.toFixed(2)}</div>
                <form id="payment-form">
                  <div id="payment-element"></div>
                  <button id="submit">
                    <span id="button-text">Pay AED ${totalAmount.toFixed(2)}</span>
                  </button>
                  <div id="error-message"></div>
                </form>
                <div class="badge">
                  🔒 Secured with 256-bit Stripe Encryption
                </div>
              </div>

              <script>
                const stripe = Stripe('${pk}');
                const elements = stripe.elements({ clientSecret: '${result.data.clientSecret}' });
                const paymentElement = elements.create('payment');
                paymentElement.mount('#payment-element');

                const form = document.getElementById('payment-form');
                form.addEventListener('submit', async (e) => {
                  e.preventDefault();
                  const btn = document.getElementById('submit');
                  const btnText = document.getElementById('button-text');
                  const errorDiv = document.getElementById('error-message');
                  
                  btn.disabled = true;
                  btnText.innerText = "Processing...";
                  errorDiv.innerText = "";

                  const { error, paymentIntent } = await stripe.confirmPayment({
                    elements,
                    redirect: 'if_required',
                    confirmParams: {
                      return_url: 'gogo://payment/callback',
                    },
                  });

                  if (error) {
                    errorDiv.innerText = error.message || "Payment failed. Please try again.";
                    btn.disabled = false;
                    btnText.innerText = "Pay AED ${totalAmount.toFixed(2)}";
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: error.message }));
                    }
                  } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', paymentIntentId: paymentIntent.id }));
                    }
                  } else {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VERIFY', paymentIntentId: '${result.data.paymentIntentId}' }));
                    }
                  }
                });
              </script>
            </body>
          </html>
        `;
        setTransactionUrl(stripeHtml);
      } else {
        Alert.alert("Error", "Failed to initialize Stripe checkout");
      }
    } catch (error: any) {
      console.error("Payment/Order error:", error);
      Alert.alert(
        "Error",
        error?.data?.message || error.message || "Failed to process request",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async (paymentIntentId: string) => {
    try {
      const result = await verifyPayment({ paymentIntentId }).unwrap();
      if (result.data?.isPaid || result.data?.status === "succeeded" || result.data?.tapStatus === "CAPTURED") {
        setShowSuccessModal(true);
      } else {
        Alert.alert("Payment Status", `Payment status: ${result.data?.status || "Pending"}`);
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      Alert.alert(
        "Verification Error",
        error?.data?.message || "Failed to verify payment",
      );
    }
  };

  const handleCloseModal = () => {
    dispatch(resetOrderDraft());
    setShowSuccessModal(false);
    // Wait for the native modal to finish closing before navigating.
    // Navigating immediately can cause native view mounting conflicts
    // (e.g. MapView) leading to crashes on Android.
    setTimeout(() => {
      if (createdOrderId) {
        router.replace(`/orders/running-order?id=${createdOrderId}`);
      } else {
        router.replace("/orders/running-order");
      }
    }, 450);
  };

  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {STEPS.map((step, index) => (
        <React.Fragment key={index}>
          <View style={styles.stepItem}>
            <Animated.View
              style={[
                styles.stepCircle,
                index <= currentStep ? styles.stepActive : styles.stepInactive,
              ]}
              layout={Layout.springify()}
            >
              <Text
                style={[
                  styles.stepNumber,
                  index <= currentStep && { color: "#000" },
                ]}
              >
                {index + 1}
              </Text>
            </Animated.View>
            <Text
              style={[
                styles.stepLabel,
                index <= currentStep
                  ? styles.stepLabelActive
                  : styles.stepLabelInactive,
              ]}
            >
              {step}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View style={styles.stepLineContainer}>
              <Animated.View
                style={[
                  styles.stepLineFill,
                  { width: index < currentStep ? "100%" : "0%" },
                ]}
              />
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Animated.View
        entering={FadeInUp.delay(100).duration(600)}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <View style={styles.card}>
        {renderStepper()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.methodsContainer}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.methodCardSelected,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.methodIcon,
                      selectedMethod === method.id && styles.methodIconSelected,
                    ]}
                  >
                    <Ionicons
                      name={method.icon as any}
                      size={28}
                      color={
                        selectedMethod === method.id
                          ? Colors.primaryDark
                          : "#999"
                      }
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text
                      style={[
                        styles.methodName,
                        selectedMethod === method.id &&
                          styles.methodNameSelected,
                      ]}
                    >
                      {method.name}
                    </Text>
                    {method.balance && (
                      <Text style={styles.methodBalance}>
                        Balance: {method.balance}
                      </Text>
                    )}
                  </View>
                  <View style={styles.radioContainer}>
                    {selectedMethod === method.id ? (
                      <View style={styles.radioSelected}>
                        <View style={styles.radioDot} />
                      </View>
                    ) : (
                      <View style={styles.radioUnselected} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>AED {subtotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Fee</Text>
                <Text style={styles.summaryValue}>AED {serviceFee}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>AED {tax}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  AED {totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <TouchableOpacity
              style={[
                styles.payButton,
                (isProcessing || isVerifying) && styles.payButtonDisabled,
              ]}
              onPress={handlePayment}
              activeOpacity={0.8}
              disabled={isProcessing || isVerifying}
            >
              {isProcessing || isVerifying ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.payButtonText}>
                    {selectedMethod === "cash"
                      ? "Place Order"
                      : `Pay AED ${totalAmount.toFixed(2)}`}
                  </Text>
                  <Ionicons
                    name={
                      selectedMethod === "cash"
                        ? "checkmark-circle-outline"
                        : "arrow-forward"
                    }
                    size={24}
                    color="#000"
                  />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>

      <PaymentSuccessModal
        visible={showSuccessModal}
        onClose={handleCloseModal}
        amount={`AED ${totalAmount.toFixed(2)}`}
        isCash={selectedMethod === "cash"}
      />

      <Modal
        visible={!!transactionUrl}
        animationType="slide"
        onRequestClose={() => setTransactionUrl(null)}
      >
        <View style={styles.webViewContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => setTransactionUrl(null)}
              style={styles.closeWebViewButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Secure Payment</Text>
            <View style={{ width: 24 }} />
          </View>
          {transactionUrl && (
            <WebView
              source={
                transactionUrl.trim().startsWith("<")
                  ? { html: transactionUrl, baseUrl: "https://stripe.com" }
                  : { uri: transactionUrl }
              }
              originWhitelist={["*"]}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === "SUCCESS" || data.type === "VERIFY") {
                    setTransactionUrl(null);
                    const id = data.paymentIntentId || currentChargeId;
                    if (id) {
                      handleVerifyPayment(id);
                    }
                  } else if (data.type === "ERROR") {
                    Alert.alert("Payment Error", data.message || "Payment could not be completed.");
                  }
                } catch (e) {
                  // non-json message
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                if (request.url.includes("gogo://payment/callback")) {
                  setTransactionUrl(null);
                  if (currentChargeId) {
                    handleVerifyPayment(currentChargeId);
                  }
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(navState) => {
                if (navState.url.includes("gogo://payment/callback")) {
                  setTransactionUrl(null);
                  if (currentChargeId) {
                    handleVerifyPayment(currentChargeId);
                  }
                }
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeWebViewButton: {
    padding: 4,
  },
  webViewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C3E50",
  },
  webViewLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  stepItem: {
    alignItems: "center",
    zIndex: 1,
    width: 60,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepInactive: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
  },
  stepLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textAlign: "center",
  },
  stepLabelActive: {
    color: Colors.text,
  },
  stepLabelInactive: {
    color: "#ccc",
  },
  stepLineContainer: {
    flex: 1,
    height: 2,
    backgroundColor: "#F0F0F0",
    marginTop: 15,
    marginHorizontal: -10,
  },
  stepLineFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 16,
  },
  methodsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  methodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0FFF0",
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  methodIconSelected: {
    backgroundColor: "#fff",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginBottom: 2,
  },
  methodNameSelected: {
    color: Colors.text,
  },
  methodBalance: {
    fontSize: 13,
    color: "#999",
  },
  radioContainer: {
    marginLeft: 8,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  summaryCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: "#666",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.text,
  },
  payButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
});

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RotateCcw } from "lucide-react-native";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("Unhandled UI error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            {this.state.error?.message || "An unexpected error occurred. Please reload the screen."}
          </Text>
          <Pressable style={styles.reloadBtn} onPress={this.handleReload}>
            <RotateCcw size={16} color="#0C0E12" />
            <Text style={styles.reloadBtnText}>Reload App</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0E12",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D4AF37",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#98A2B3",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D4AF37",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reloadBtnText: {
    color: "#0C0E12",
    fontSize: 14,
    fontWeight: "700",
  },
});

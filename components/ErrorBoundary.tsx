import React, { Component, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { COLORS, SPACING } from '../constants/theme';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Erreur au démarrage</Text>
          <ScrollView style={styles.box}>
            <Text style={styles.msg}>{this.state.error.message}</Text>
          </ScrollView>
          <Button mode="contained" onPress={() => this.setState({ error: null })}>
            Réessayer
          </Button>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: SPACING.lg, justifyContent: 'center', backgroundColor: COLORS.background },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.danger, marginBottom: SPACING.md },
  box: { maxHeight: 200, marginBottom: SPACING.md, backgroundColor: COLORS.dangerMuted, padding: SPACING.sm, borderRadius: 8 },
  msg: { fontSize: 13, color: COLORS.text },
});

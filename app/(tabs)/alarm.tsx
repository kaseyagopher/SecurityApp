import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function AlarmScreen() {
    return (
        <View style={styles.container}>
            <Text variant="headlineMedium">Alarme</Text>
            <Text variant="bodyLarge">Contrôle de l'alarme</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
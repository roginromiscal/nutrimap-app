import { StyleSheet, Text, View } from 'react-native';

export default function OfflineMapNotice() {
  return (
    <View style={styles.banner} pointerEvents="none">
      <Text style={styles.text}>
        You&apos;re offline — map imagery won&apos;t load until you reconnect
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(27, 83, 51, 0.92)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    zIndex: 20,
    elevation: 20,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

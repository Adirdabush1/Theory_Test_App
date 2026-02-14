import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SelectTestTypeScreen() {
  const router = useRouter();

  const testTypes = [
    { id: 'B', label: 'B - רכב פרטי' },
    { id: 'A', label: 'A - אופנוע' },
    { id: 'C', label: 'C - משאית' },
    { id: 'C1', label: 'C1 - רכב כבד עד 12 טון' },
    { id: 'D', label: 'D - אוטובוס' },
    { id: '1', label: '1 - טרקטור' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>בחר סוג תיאוריה</Text>

      <View style={styles.list}>
        {testTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: "/PracticeScreen",
                params: { licenseType: type.id },
              })
            }
          >
            <Text style={styles.buttonText}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
  },
  list: {
    flexDirection: "column",
    gap: 15,
  },
  button: {
    backgroundColor: "#e9ecef",
    padding: 18,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
});

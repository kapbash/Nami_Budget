import { Text, View } from "react-native";
import { Link } from "expo-router";


export default function Dashboard() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>This is my Dashboard</Text>
      <Link href={"/budget"}>
          Go to Budget Page
      </Link>
    </View>
  );
}

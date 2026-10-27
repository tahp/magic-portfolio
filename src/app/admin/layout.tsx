import { Flex, Text } from "@once-ui-system/core";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex vertical="center" width="100%" padding="40px 20px">
      <div style={{ maxWidth: "800px", margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </Flex>
  );
}

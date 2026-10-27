"use client";

import { signIn } from "next-auth/react";
import { Button, Text, Flex } from "@once-ui-system/core";

export default function AdminLogin() {
  return (
    <Flex vertical="center" align="center" justify="center" height="100vh" gap="24">
      <Flex vertical="center" gap="12" align="center">
        <Text size="xl" weight="strong">Admin Access</Text>
        <Text onBackground="neutral-medium">Please sign in with your Google account to manage your portfolio</Text>
      </Flex>
      
      <Button 
        variant="primary" 
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
        style={{ width: "240px" }}
      >
        Continue with Google
      </Button>
    </Flex>
  );
}

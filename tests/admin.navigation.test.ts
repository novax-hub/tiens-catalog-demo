import assert from "node:assert/strict";
import { test } from "node:test";

import { getAdminLandingPath, getAdminNavItems } from "../src/modules/admin/admin-navigation.ts";

test("admin landing path matches role", () => {
  assert.equal(getAdminLandingPath("SUPER_ADMIN"), "/admin/dashboard");
  assert.equal(getAdminLandingPath("ADMIN"), "/admin/dashboard");
  assert.equal(getAdminLandingPath("EDITOR"), "/admin/regional-configurations");
  assert.equal(getAdminLandingPath("ASSISTANT"), "/admin/regional-configurations");
});

test("admin nav items match role visibility", () => {
  assert.deepEqual(getAdminNavItems("SUPER_ADMIN").map((item) => item.label), [
    "Dashboard",
    "Productos",
    "Productos por País",
    "Usuarios",
    "Cerrar sesión",
  ]);

  assert.deepEqual(getAdminNavItems("ADMIN").map((item) => item.label), [
    "Dashboard",
    "Productos por País",
    "Usuarios",
    "Cerrar sesión",
  ]);

  assert.deepEqual(getAdminNavItems("EDITOR").map((item) => item.label), [
    "Productos por País",
    "Cerrar sesión",
  ]);

  assert.deepEqual(getAdminNavItems("ASSISTANT").map((item) => item.label), [
    "Productos por País",
    "Cerrar sesión",
  ]);
});
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  userAc,
} from "better-auth/plugins/admin/access";

const statement = {
  profile: ["create", "update", "delete", "list", "get"],
  ...defaultStatements,
} as const;

const ac = createAccessControl(statement);

const admin = ac.newRole({
  profile: ["create", "update", "delete", "list", "get"],
  ...adminAc.statements,
});

const owner = ac.newRole({
  profile: ["create", "update", "get"],
});

const staff = ac.newRole({
  profile: ["create", "update", "get"],
});

const customer = ac.newRole({
  profile: ["create", "update", "get"],
});

export { ac, admin, owner, staff, customer };

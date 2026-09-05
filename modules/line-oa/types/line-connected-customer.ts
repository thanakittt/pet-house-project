export type LineConnectedCustomer = {
  id: string;
  nickname: string;
  userName: string | null;
  contactPhoneNumber: string | null;
  lineUserId: string;
  petNames: string[];
};

/**
 * กรองรายชื่อลูกค้าที่เชื่อมต่อ LINE ด้วยคำค้นหา (ชื่อลูกค้า, ชื่อบัญชี, เบอร์โทร, ชื่อสัตว์เลี้ยง)
 */
export function filterLineConnectedCustomers(
  customers: LineConnectedCustomer[],
  searchQuery: string,
): LineConnectedCustomer[] {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return customers;
  }

  return customers.filter((customer) => {
    const nicknameMatch = customer.nickname.toLowerCase().includes(query);
    const userNameMatch = customer.userName?.toLowerCase().includes(query) ?? false;
    const phoneMatch = customer.contactPhoneNumber?.toLowerCase().includes(query) ?? false;
    const petMatch = customer.petNames.some((petName) =>
      petName.toLowerCase().includes(query),
    );

    return nicknameMatch || userNameMatch || phoneMatch || petMatch;
  });
}

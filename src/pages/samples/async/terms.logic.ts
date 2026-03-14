export interface User {
  id: number;
  name: string;
  email: string;
}

export async function loadUsers(): Promise<User[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
        { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' }
      ]);
    }, 1000);
  });
}
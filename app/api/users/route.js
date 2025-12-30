import { getAllUsers, createUser } from '@/lib/services/userService'

export async function GET() {
  try {
    const users = await getAllUsers()
    return Response.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()
    
    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email, and password are required' }, 
        { status: 400 }
      )
    }
    
    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' }, 
        { status: 400 }
      )
    }
    
    const user = await createUser(name, email, password)
    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}
import { getAll, create, verify } from '@/lib/services/DataBaseServices/userService';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    const users = await getAll()
    return Response.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'verify') {
      const { email, password } = body

      if (!email || !password) {
        return Response.json(
          { error: 'Email and password are required' },
          { status: 400 }
        )
      }

      const user = await verify(email, password)

      if (!user) {
        return Response.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return Response.json({
        message: 'Login successful',
        token: token
      })
    }

    const { name, email, password } = body

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

    const user = await create({ name, email, password })
    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return Response.json({ error: error.message }, { status: 400 })
  }
}
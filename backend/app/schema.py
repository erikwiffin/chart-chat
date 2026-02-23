type_defs = """
    type Query {
        hello: String!
        users: [User!]!
        projects: [Project!]!
        project(id: ID!): Project
    }

    type Mutation {
        createUser(name: String!, email: String!): User!
        createProject(name: String!): Project!
        sendMessage(projectId: ID!, content: String!): Message!
    }

    type Subscription {
        messageAdded(projectId: ID!): Message!
    }

    type User {
        id: ID!
        name: String!
        email: String!
    }

    type Project {
        id: ID!
        name: String!
        messages: [Message!]!
        createdAt: String!
    }

    enum MessageRole {
        user
        assistant
    }

    type Message {
        id: ID!
        content: String!
        role: MessageRole!
        createdAt: String!
    }
"""

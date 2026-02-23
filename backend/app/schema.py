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
        createProjectFromPrompt(content: String!): Project!
        sendMessage(projectId: ID!, content: String!): Message!
    }

    type Subscription {
        messageAdded(projectId: ID!): Message!
        projectNameUpdated(projectId: ID!): Project!
        chartAdded(projectId: ID!): Chart!
    }

    type User {
        id: ID!
        name: String!
        email: String!
    }

    type Project {
        id: ID!
        uuid: String!
        name: String!
        messages: [Message!]!
        dataSources: [DataSource!]!
        charts: [Chart!]!
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

    type DataSource {
        id: ID!
        name: String!
        sourceType: String!
        columns: [String!]!
        rowCount: Int!
        createdAt: String!
    }

    type Chart {
        id: ID!
        title: String!
        spec: String!
        createdAt: String!
    }
"""

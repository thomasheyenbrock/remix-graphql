# github-explorer

This exmple shows how to use `remix-graphql` to execute GraphQL operations
against a remote GraphQL API in your loaders and actions. It uses the
`sendGraphQLRequest` function.

In the example app you can search GitHub users by name and look up their ten
most starred public repositories. The search query runs in an action function
that handles a form submission with the string to search by. The query for
a user and the repos runs in a loader function.

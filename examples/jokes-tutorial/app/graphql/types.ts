export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type CreateJokeFieldErrors = {
  content?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
};

export type CreateJokeFields = {
  content: Scalars['String'];
  name: Scalars['String'];
};

export type CreateJokeResult = {
  fieldErrors?: Maybe<CreateJokeFieldErrors>;
  fields?: Maybe<CreateJokeFields>;
  joke?: Maybe<Joke>;
};

export type Joke = {
  content: Scalars['String'];
  id: Scalars['ID'];
  jokster: User;
  name: Scalars['String'];
};

export type LoginFieldErrors = {
  password?: Maybe<Scalars['String']>;
  username?: Maybe<Scalars['String']>;
};

export type LoginFields = {
  loginType: Scalars['String'];
  password: Scalars['String'];
  username: Scalars['String'];
};

export type LoginResult = {
  fieldErrors?: Maybe<LoginFieldErrors>;
  fields?: Maybe<LoginFields>;
  formError?: Maybe<Scalars['String']>;
};

export enum LoginType {
  Login = 'login',
  Register = 'register'
}

export enum Method {
  Delete = 'delete'
}

export type Mutation = {
  createJoke?: Maybe<CreateJokeResult>;
  editJoke?: Maybe<Joke>;
  login?: Maybe<LoginResult>;
  logout?: Maybe<Scalars['Boolean']>;
};


export type MutationCreateJokeArgs = {
  content: Scalars['String'];
  name: Scalars['String'];
};


export type MutationEditJokeArgs = {
  id: Scalars['ID'];
  method: Method;
};


export type MutationLoginArgs = {
  loginType: LoginType;
  password: Scalars['String'];
  redirectTo?: InputMaybe<Scalars['String']>;
  username: Scalars['String'];
};

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export enum OrderJokesBy {
  CreatedAt = 'createdAt'
}

export type Query = {
  joke?: Maybe<Joke>;
  jokes: Array<Joke>;
  me?: Maybe<User>;
  randomJoke?: Maybe<Joke>;
};


export type QueryJokeArgs = {
  id: Scalars['ID'];
};


export type QueryJokesArgs = {
  orderBy?: InputMaybe<OrderJokesBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']>;
  take?: InputMaybe<Scalars['Int']>;
};

/** A User */
export type User = {
  id: Scalars['ID'];
  username: Scalars['String'];
};

export type JokesQueryVariables = Exact<{ [key: string]: never; }>;


export type JokesQuery = { me?: { username: string } | null | undefined, jokes: Array<{ id: string, name: string }> };

export type JokeQueryVariables = Exact<{
  jokeId: Scalars['ID'];
}>;


export type JokeQuery = { me?: { id: string } | null | undefined, joke?: { name: string, content: string, jokster: { id: string } } | null | undefined };

export type DeleteJokeMutationVariables = Exact<{
  _method: Method;
  jokeId: Scalars['ID'];
}>;


export type DeleteJokeMutation = { editJoke?: { id: string } | null | undefined };

export type RandomJokeQueryVariables = Exact<{ [key: string]: never; }>;


export type RandomJokeQuery = { randomJoke?: { id: string, name: string, content: string } | null | undefined };

export type CreateJokeMutationVariables = Exact<{
  name: Scalars['String'];
  content: Scalars['String'];
}>;


export type CreateJokeMutation = { createJoke?: { fields?: { name: string, content: string } | null | undefined, fieldErrors?: { name?: string | null | undefined, content?: string | null | undefined } | null | undefined, joke?: { id: string } | null | undefined } | null | undefined };

export type CreateJokeUserQueryVariables = Exact<{ [key: string]: never; }>;


export type CreateJokeUserQuery = { me?: { username: string } | null | undefined };

export type LoginMutationVariables = Exact<{
  loginType: LoginType;
  username: Scalars['String'];
  password: Scalars['String'];
  redirectTo?: InputMaybe<Scalars['String']>;
}>;


export type LoginMutation = { login?: { formError?: string | null | undefined, fields?: { loginType: string, username: string, password: string } | null | undefined, fieldErrors?: { username?: string | null | undefined, password?: string | null | undefined } | null | undefined } | null | undefined };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { logout?: boolean | null | undefined };

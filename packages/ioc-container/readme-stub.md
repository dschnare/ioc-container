/**
 * This interface represents an inversion of control container.
 */
export interface IIocContainer {
  /**
   * Attempts to resolve a registered service with the specified name. Only
   * transient service instances will be released. To release singleton
   * service instances the container must be destroyed.
   *
   * @arg name Service name to be resolved.
   * @throw Error if no service is found.
   * @return The service instance.
   */
  resolve(name: string): any
  /**
   * Attempts to resolve a list of services. Only transient service instances
   * will be released. To release singleton service instances the container
   * must be destroyed.
   *
   * @args The names of services to resolve.
   * @throw Error if a service cannot be found.
   * @return Array of service instances.
   */
  resolveAll(...names: string[]): any[]
  /**
   * Attempts to release the specified service instance. Not all services have
   * the same lifetime. The following describes the lifetime of each service
   * type.
   *
   * Instance lifetime - Only released when container is destroyed.
   * Singleton lifetime - Only released when container is destroyed.
   * Transient lifetime - Released when container is destroyed or when passed to release.
   *
   * @arg instance The service instance to release.
   */
  release(instance): void
  /**
   * Registers a service with an instance lifetime. Each time this service is
   * resolved the instance is returned as-is. Service instances with instance
   * lifetime are only released when the container is destroyed, however if the
   * service instance defines a destroy() method it will not be called.
   *
   * @arg name The name of the service being registered
   * @arg instance The service instance being registered
   */
  instance(name: string, instance: any): void
  /**
   * Registers a service with a singleton lifetime. The first time this service
   * is resolved a new instance will be instantiated, all subsequent service
   * resolutions will return the same instance. Service instances with singleton
   * lifetime have the same lifetime as the container, so are only released
   * when the container is destroyed.
   *
   * The service instance can optionally define an initialize() and a destroy()
   * method that will be called after the service instance has been instantiated
   * and after the service instance has been destroyed respectively.
   *
   *
   * @arg name The name of the service being registered.
   * @arg factory The factory function that will instantiate the service.
   * @arg opts The optional options for this service registration.
   */
  singleton(name: string, factory: IServiceFactory, opts?: ServiceOptions): void
  /**
   * Registers a service with a transient lifetime. Each time this service is
   * resolved a new service instance will be instantiated. Service instances
   * with a transient lifetime will be released when the container is destroyed
   * or when passed to release().
   *
   * The service instance can optionally define an initialize() and a destroy()
   * method that will be called after the service instance has been instantiated
   * and after the service instance has been destroyed respectively.
   *
   * @arg name The name of the service being registered.
   * @arg factory The factory function that will instantiate the service.
   * @arg opts The optional options for this service registration.
   */
  transient(name: string, factory: IServiceFactory, opts?: ServiceOptions): void
  /**
   * Starts a service lifetime scope. While this scope is open  all services
   * resolved will be tracked and released when the scope ends.
   */
  beginScope(): void
  /**
   * Ends the currently open scope, releasing all service instances resolved
   * while the scope was open.
   */
  endScope(): void
  /**
   * Destroys the container and all instantiated services, including
   * singletons.
   */
  destroy(): void
}
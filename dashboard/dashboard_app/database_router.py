class DatabaseRouter:
    """
    custom database router for Django and WordPress integration.
    """
    def db_for_read(self, model, **hints):
        """ Read operations: distinguish between WordPress and Django databases """
        if model._meta.app_label == 'wordpress':
            return 'wordpress'
        return 'default'

    def db_for_write(self, model, **hints):
        """ Write operations: distinguish between WordPress and Django databases """
        if model._meta.app_label == 'wordpress':
            return 'wordpress'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """ Allow relations between databases """
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """ Allow WordPress to be read-only, no migrations """
        if app_label == 'wordpress':
            return False
        return True

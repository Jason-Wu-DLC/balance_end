class DatabaseRouter:
    """
    控制不同应用的数据存储位置
    """
    def db_for_read(self, model, **hints):
        """ 读操作：区分 WordPress 和 Django 数据库 """
        if model._meta.app_label == 'wordpress':
            return 'wordpress'
        return 'default'

    def db_for_write(self, model, **hints):
        """ 写操作：区分 WordPress 和 Django 数据库 """
        if model._meta.app_label == 'wordpress':
            return 'wordpress'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """ 允许数据库间的关系 """
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """ 允许 WordPress 只读，不迁移 """
        if app_label == 'wordpress':
            return False
        return True

Ext.define('Scalr.ui.FarmBuilderRoleEdit', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.farmroleedit',

	layout: {
		type: 'vbox',
        align: 'stretch'
	},
	currentRole: null,
    cls: 'scalr-ui-farmbuilder-roleedit',
    items: [{
        xtype: 'panel',
        flex: 1,
        layout: 'card',
        itemId: 'tabspanel',
        padding: '12 0 0 0',
        style: 'background:#b5c0ce;',
        dockedItems: [{
            xtype: 'container',
            itemId: 'tabs',
            dock: 'left',
            cls: 'x-docked-tabs',
            width: 200,
            padding: 0,
            autoScroll: true
        }],
        onAdd: function (cmp) {
            cmp.tabButton = this.getDockedComponent('tabs').add({
                xtype: 'button',
                ui: 'tab',
                textAlign: 'left',
                text: cmp.deprecated ? '<span class="x-btn-inner-html-wrap">' + cmp.tabTitle + (cmp.deprecated ? '<span class="superscript">deprecated</span>' : '') + '</span>' : cmp.tabTitle,
                toggleGroup: 'editrole-tabs',
                allowDepress: false,
                tabCmp: cmp,
                cls: cmp.deprecated ? 'x-btn-tab-deprecated' : '',
                handler: function (b) {
                    this.layout.setActiveItem(b.tabCmp);
                },
				disableMouseDownPressed: true,
                scope: this
            });
        }
    }],
    
    onTabActivate: function(tab) {
        this.fireEvent('tabactivate', tab);
    },
    
    onTabDeactivate: function(tab) {
        this.fireEvent('tabdeactivate', tab);
    },

    addRoleDefaultValues: function (record) {
		var settings = record.get('settings'),
            roleDefaultSettings = this.moduleParams.roleDefaultSettings || {};
    
		this.down('#tabspanel').items.each(function(item) {
			if (item.isActive(record)) {
				Ext.applyIf(settings, item.getDefaultValues(record, roleDefaultSettings));
            }
		});
        Ext.applyIf(settings, this.down('#maintab').getDefaultValues(record, roleDefaultSettings));
        
		record.set('settings', settings);
	},

	setCurrentRole: function (record) {
		this.currentRole = record;
	},

    createTabs: function() {
        var tabsPanel = this.down('#tabspanel'),
            moduleParams = this.moduleParams;
        this.tabs = [];
        this.tabs.push(this.insert(0, Scalr.cache['Scalr.ui.farms.builder.tabs.main'](moduleParams['tabParams'])));
        for (var i = 0; i < moduleParams.tabs.length; i++) {
            this.tabs.push(tabsPanel.add(Scalr.cache['Scalr.ui.farms.builder.tabs.' + moduleParams.tabs[i]](moduleParams['tabParams'])));
        }
    },
    
    setActiveTab: function(id) {
        var ct = this.getComponent('tabspanel'), 
            tab = ct.getComponent(id);
        if (tab) {
            ct.getDockedComponent('tabs').items.each(function(item) {
                if (item.tabCmp === tab) {
                    item.toggle(true);
                    ct.layout.setActiveItem(tab);
                    return false;
                }
            });
        }
    },
    
    initComponent: function() {
        this.callParent(arguments);
        this.on({
            beforeactivate: function () {
                var me = this,
                    record = me.currentRole;
                this.suspendLayouts();
                if (record.get('is_bundle_running') == true) {
                    Scalr.message.Error('This role is locked by server snapshot creation process. Please wait till snapshot will be created.');
                    return false;
                } else {
                    var activate = true,
                        firstTab, lastTab;
                    for (var i=0, len=this.tabs.length; i<len; i++) {
                        activate = this.tabs[i].setCurrentRole(record, activate);
                        if (this.tabs[i].tabButton !== undefined) {
                            if (this.tabs[i].tabButton.isVisible()) {
                                if (firstTab === undefined) {
                                    firstTab = this.tabs[i].tabButton;
                                }
                                lastTab = this.tabs[i].tabButton;
                                this.tabs[i].tabButton.removeCls('x-btn-tab-first x-btn-tab-last');
                            }
                        }
                    }
                    if (firstTab !== undefined) {
                        firstTab.addCls('x-btn-tab-first');
                    }
                    if (lastTab !== undefined) {
                        lastTab.addCls('x-btn-tab-last');
                    }
                }
                this.resumeLayouts(true);
            },

            deactivate: function () {
                var tabsPanel = this.down('#tabspanel');
                if (tabsPanel.layout.activeItem) {
                    tabsPanel.layout.activeItem.hide();
                    tabsPanel.layout.activeItem.fireEvent('deactivate', tabsPanel.layout.activeItem);
                    tabsPanel.layout.activeItem = null;
                }
            }
        });
	}
});

Scalr.regPage('Scalr.ui.farms.builder.tabs.main', function (tabParams) {
	return Ext.create('Scalr.ui.FarmsBuilderTab', {
		itemId: 'maintab',
        
        layout: {
            type: 'hbox',
            align: 'stretch'
        },
        cls: 'x-panel-column-left scalr-ui-farmbuilder-roleedit-maintab',
        isLoading: false,
        
        minified: false,
        stateful: true,
        stateId: 'farms-builder-roleedit-maintab',
        stateEvents: ['minify', 'maximize'],
        autoScroll: false,
        cache: null,
        
        listeners: {
            boxready: function() {
                var me = this;
                me.add({
                    xtype: 'button',
                    ui: '',
                    cls: 'x-btn-collapse',
                    enableToggle: true,
                    disableMouseDownPressed: true,
                    margin: '20 32 0 0',
                    pressed: this.minified,
                    toggleHandler: function(btn) {
                        me.toggleMinified();
                    }
                });
            },
            staterestore: function() {
                this.setMinified(this.minified);
            }
        },
        
        getState: function() {
            return {
                minified: this.minified
            }
        },
        
        toggleMinified: function() {
            this.minified ? this.maximize() : this.minify();
        },
        
        minify: function(){
            this.setMinified(true);
            this.fireEvent('minify');
        },
        
        maximize: function() {
            this.setMinified(false);
            this.fireEvent('maximize');
        },
        
        setMinified: function(minified) {
            this.suspendLayouts();
            Ext.Array.each(this.query('[hideOnMinify]'), function(item){
                item.setVisible(!minified && !item.forceHidden);
            });
            this.resumeLayouts(true);
            this.setHeight(minified ? 66 : null);
            this.minified = minified;
        },
        
        setCurrentRole: function (record, activate) {
            this.currentRole = record;
            this.fireEvent('activate', this, this);
            return true;
        },
        
		getDefaultValues: function (record) {
			switch (record.get('platform')) {
                case 'ec2':
                    return {
                        'aws.availability_zone': '',
                        'aws.instance_type': record.get('image', true)['architecture'] == 'i386' ? 'm1.small' : 'm1.large'
                    };
                break;
                case 'rackspace':
                    return {
                        'rs.flavor-id': 1
                    };
                break;
                case 'cloudstack':
                case 'idcf':
                    return {
                        'cloudstack.service_offering_id': ''
                    };
                break;
                case 'gce':
                    return {
                        'gce.machine-type': ''
                    };
                break;
                default:
                    return {};
                break;
            }
		},

		beforeShowTab: function (record, handler) {
            var me = this,
                platform = record.get('platform'),
                cloudLocation = record.get('cloud_location');

            callback = function(data, status) {
                if (me.callPlatformHandler('beforeShowTab', [record, handler]) === false) {
                    handler();
                }
            };

            if (platform === 'gce') {
                cloudLocation = record.getGceCloudLocation();
                cloudLocation = cloudLocation.length > 0 ? cloudLocation[0] : '';
            }

            Scalr.loadInstanceTypes(platform, cloudLocation, Ext.bind(me.setupInstanceTypeField, me, [record, callback], true));
		},

        setupInstanceTypeField: function(data, status, record, callback) {
            var me = this,
                field = me.down('[name="instanceType"]'),
                limits = me.up('#farmbuilder').getLimits(record.get('platform'), record.getInstanceTypeParamName()),
                instanceType = record.getInstanceType(data, limits);

            field.setDisabled(!status);
            field.store.load({ data: instanceType['list'] || [] });
            me.isLoading = true;
            field.setValue(instanceType['value']);
            field.resetOriginalValue();
            me.isLoading = false;
            field.setReadOnly(instanceType.list.length === 0 || (instanceType.list.length === 1 && instanceType.list[0].id === instanceType.value));
            field.toggleIcon('governance', !!limits);
            field.updateListEmptyText({cloudLocation:record.get('cloud_location'), limits: !!limits});

            if(callback) callback();
        },
		
        onRoleUpdate: function(record, name, value, oldValue) {
            if (this.suspendOnRoleUpdate > 0) {
                return;
            }
            
            var fullname = name.join('.'), 
                comp;
            if (fullname === 'settings.scaling.min_instances') {
                comp = this.down('[name="min_instances"]');
            } else if (fullname === 'settings.scaling.max_instances') {
                comp = this.down('[name="max_instances"]');
            } else if (fullname === 'settings.scaling.enabled') {
                this.down('#mainscaling').setScalingDisabled(value != 1);
            } else if (fullname === 'scaling') {
                this.down('#mainscalinggrid').loadMetrics(value);
            /*} else if (fullname === 'settings.db.msr.data_storage.engine') {
                if (record.get('platform') === 'gce') {
                    this.gce.refreshMachineType.call(this, record, null, value);
                }*/
            }
            
            if (comp) {
                comp.suspendEvents(false);
                comp.setValue(value);
                comp.resumeEvents();
            }
        },

		showTab: function (record) {
            var me = this,
                settings = record.get('settings', true),
                platform = record.get('platform'),
                arch = record.get('image', true)['architecture'],
                roleBehaviors = record.get('behaviors').split(','),
                behaviors = [],
                osName = record.get('os') + (!Ext.isEmpty(arch) ? ' (' + (arch == 'i386' ? '32' : '64') + 'bit)' : '');
            me.isLoading = true;
            
            Ext.Array.each(roleBehaviors, function(b) {
               behaviors.push(tabParams['behaviors'][b] || b); 
            });
            behaviors = behaviors.join(', ');
            
            me.setFieldValues({
                alias: record.get('alias'),
                min_instances: settings['scaling.min_instances'] || 1,
                max_instances: settings['scaling.max_instances'] || 1,
                running_servers: {
                    running_servers: record.get('running_servers'),
                    suspended_servers: record.get('suspended_servers'),
                    'base.consider_suspended': settings['base.consider_suspended'] || 'running'
                }
            });
            me.down('#roleName').update('<img src="' + Ext.BLANK_IMAGE_URL + '" class="x-icon-platform-small x-icon-platform-small-' + record.get('platform') + '"/>&nbsp;&nbsp;<label class="x-label-grey" title="' + record.get('name') + '">' + record.get('name') + '</label>');
            me.down('#replaceRole').setVisible(!record.get('new') && record.get('os_family'))
            me.down('#osName').update('<img src="' + Ext.BLANK_IMAGE_URL + '" class="x-icon-osfamily-small x-icon-osfamily-small-' + record.get('os_family') + '"/>&nbsp;&nbsp;<label class="x-label-grey" title="' + osName + '">' + osName + '</label>');
            me.down('#cloud_location').selectLocation(platform, platform === 'gce' ? settings['gce.region'] : record.get('cloud_location'));
            
            me.suspendLayouts();
            me.down('#column2').items.each(function(comp) {
                comp.setVisible(comp.checkPlatform !== undefined ? comp.checkPlatform(platform) : Ext.Array.contains(comp.platform, platform));
            });
            me.resumeLayouts(true);
            
            var scalingTab = me.up('farmroleedit').down('#scaling'),
                topScalingTab = me.down('#mainscaling'),
                isVpcRouter = Ext.Array.contains(roleBehaviors, 'router');
            topScalingTab.down('#mainscalinggrid').loadMetrics(record.get('scaling'));
            if (scalingTab.isActive(record) && settings['scaling.enabled'] == 1 || isVpcRouter) {
                topScalingTab.setScalingDisabled(false);
                if (isVpcRouter) {
                    topScalingTab.down('[name="max_instances"]').setReadOnly(true);
                    topScalingTab.down('[name="min_instances"]').setReadOnly(true);
                } else {
                    var readonly = scalingTab.isTabReadonly(record),
                        isCfRole = (Ext.Array.contains(roleBehaviors, 'cf_cloud_controller') || Ext.Array.contains(roleBehaviors, 'cf_health_manager'));
                    topScalingTab.down('[name="max_instances"]').setReadOnly(readonly);
                    topScalingTab.down('[name="min_instances"]').setReadOnly(readonly && (isCfRole || !record.get('new')));
                }
            } else {
                topScalingTab.setScalingDisabled(true);
            }

            me.callPlatformHandler('showTab', arguments);
            
            me.isLoading = false;
		},
        
		onParamChange: function (name, value, text) {
            var record = this.currentRole;
            if (record && !this.isLoading) {
                this.suspendOnRoleUpdate++;
                switch (name) {
                    case 'min_instances':
                    case 'max_instances':
                        var settings = record.get('settings');
                        settings['scaling.' + name] = value;
                        record.set('settings', settings);
                    break;
                    case 'instanceType':
                        var settings = record.get('settings');
                        settings[record.getInstanceTypeParamName()] = value;
                        settings['info.instance_type_name'] = text;
                        record.set('settings', settings);
                    break;
                    case 'alias':
                        record.set('alias', value);
                        this.up('farmroleedit').fireEvent('rolealiaschange', value);
                    break;
                    default:
                        this.callPlatformHandler('saveParam', [name, value]);
                    break;
                }
                this.suspendOnRoleUpdate--;
            }
		},
        
        callPlatformHandler: function(method, args) {
            var handler = this.currentRole.get('platform');
            if (Scalr.isOpenstack(handler)) {
                handler = 'openstack';
            } else if (Scalr.isCloudstack(handler)) {
                handler = 'cloudstack';
            }
            if (this[handler] && this[handler][method]) {
                this[handler][method].apply(this, args);
            } else {
                return false;
            }
        },
		
        ec2: {
            beforeShowTab: function(record, handler) {
                this.cache = null;
                if (this.up('#fbcard').down('#farm').getVpcSettings() !== false || Ext.Array.contains(record.get('behaviors').split(','), 'router')) {
                    this.down('[name="aws.availability_zone"]').hide();
                    this.down('[name="aws.cloud_location"]').setValue(record.get('cloud_location')).show();
                    handler();
                } else {
                    Scalr.cachedRequest.load(
                        {
                            url: '/platforms/ec2/xGetAvailZones',
                            params: {cloudLocation: record.get('cloud_location')}
                        },
                        function(data, status, cacheId){
                            this.cache = data;
                            this.down('[name="aws.availability_zone"]').show().setDisabled(!status);
                            this.down('[name="aws.cloud_location"]').hide();
                            handler();
                        },
                        this
                    );
                }
            },
            showTab: function(record) {
                var settings = record.get('settings', true),
                    field;

                //availability zone
                field = this.down('[name="aws.availability_zone"]');
                var zones = Ext.Array.map(this.cache || [], function(item){ item.disabled = item.state != 'available'; return item;}),
                    data = [{ 
                        id: 'x-scalr-diff', 
                        name: 'Distribute equally' 
                    },{ 
                        id: '', 
                        name: 'AWS-chosen' 
                    },{ 
                        id: 'x-scalr-custom', 
                        name: 'Selected by me',
                        items: zones
                    }],
                    zone = settings['aws.availability_zone'] || '',
                    disableAvailZone =  record.get('behaviors').match('mysql') && settings['mysql.data_storage_engine'] == 'ebs' &&
                                        settings['mysql.master_ebs_volume_id'] != '' && settings['mysql.master_ebs_volume_id'] != undefined &&
                                        record.get('generation') != 2 && this.down('[name="aws.availability_zone"]').getValue() != '' &&
                                        this.down('[name="aws.availability_zone"]').getValue() != 'x-scalr-diff';
                    
                field.store.loadData(data);
                if (zone.match(/x-scalr-custom/)) {
                    zone = {id: 'x-scalr-custom', items: zone.replace('x-scalr-custom=', '').split(':')};
                } else if (!Ext.isEmpty(zone) && zone !== 'x-scalr-diff' && zone != 'x-scalr-custom') {
                    zone = {id: 'x-scalr-custom', items: [zone]};
                }

                field.setValue(zone);
                if (!field.disabled) {
                    field.setDisabled(disableAvailZone);
                }
                this.down('#aws_availability_zone_warn').setVisible(disableAvailZone && field.isVisible());
            },
            saveParam: function(name, value) {
                var record = this.currentRole,
                    settings = record.get('settings');
                switch (name) {
                    case 'aws.availability_zone':
                        if (Ext.isObject(value)) {
                            if (value.items) {
                                if (value.items.length === 1) {
                                    settings[name] = value.items[0];
                                } else if (value.items.length > 1) {
                                    settings[name] = value.id + '=' + value.items.join(':');
                                }
                            }
                        } else {
                            settings[name] = value;
                        }
                    break;
                }
                record.set('settings', settings);
            
            }
        },
        
        eucalyptus: {
            beforeShowTab: function(record, handler) {
                this.cache = null;
                if (this.up('#fbcard').down('#farm').getVpcSettings() !== false || Ext.Array.contains(record.get('behaviors').split(','), 'router')) {
                    this.down('[name="euca.availability_zone"]').hide();
                    this.down('[name="euca.cloud_location"]').setValue(record.get('cloud_location')).show();
                    handler();
                } else {
                    Scalr.cachedRequest.load(
                        {
                            url: '/platforms/eucalyptus/xGetAvailZones',
                            params: {cloudLocation: record.get('cloud_location')}
                        },
                        function(data, status, cacheId){
                            this.cache = data;
                            this.down('[name="euca.availability_zone"]').show().setDisabled(!status);
                            this.down('[name="euca.cloud_location"]').hide();
                            handler();
                        },
                        this
                    );
                }
            },
            showTab: function(record) {
                var settings = record.get('settings', true),
                    field;

                //availability zone
                field = this.down('[name="euca.availability_zone"]');
                var zones = Ext.Array.map(this.cache || [], function(item){ item.disabled = item.state != 'available'; return item;}),
                    data = [{ 
                        id: 'x-scalr-diff', 
                        name: 'Distribute equally' 
                    },{ 
                        id: '', 
                        name: 'Euca-chosen' 
                    },{ 
                        id: 'x-scalr-custom', 
                        name: 'Selected by me',
                        items: zones
                    }],
                    zone = settings['euca.availability_zone'] || '',
                    disableAvailZone =  record.get('behaviors').match('mysql') && settings['mysql.data_storage_engine'] == 'ebs' &&
                                        settings['mysql.master_ebs_volume_id'] != '' && settings['mysql.master_ebs_volume_id'] != undefined &&
                                        record.get('generation') != 2 && this.down('[name="aws.availability_zone"]').getValue() != '' &&
                                        this.down('[name="euca.availability_zone"]').getValue() != 'x-scalr-diff';
                    
                field.store.loadData(data);
                if (zone.match(/x-scalr-custom/)) {
                    zone = {id: 'x-scalr-custom', items: zone.replace('x-scalr-custom=', '').split(':')};
                } else if (!Ext.isEmpty(zone) && zone !== 'x-scalr-diff' && zone != 'x-scalr-custom') {
                    zone = {id: 'x-scalr-custom', items: [zone]};
                }

                field.setValue(zone);
                if (!field.disabled) {
                    field.setDisabled(disableAvailZone);
                }
                this.down('#euca_availability_zone_warn').setVisible(disableAvailZone && field.isVisible());
            },
            saveParam: function(name, value) {
                var record = this.currentRole,
                    settings = record.get('settings');
                switch (name) {
                    case 'euca.availability_zone':
                        if (Ext.isObject(value)) {
                            if (value.items) {
                                if (value.items.length === 1) {
                                    settings[name] = value.items[0];
                                } else if (value.items.length > 1) {
                                    settings[name] = value.id + '=' + value.items.join(':');
                                }
                            }
                        } else {
                            settings[name] = value;
                        }
                    break;
                }
                record.set('settings', settings);
            
            }
        },
        
        rackspace: {
            showTab: function(record) {
                this.down('[name="rs.cloud_location"]').setValue(record.get('cloud_location'));
            },
            saveParam: function(name, value) {
                var record = this.currentRole,
                    settings = record.get('settings');
                settings[name] = value;
                record.set('settings', settings);
            }
        },
        
        openstack: {
            beforeShowTab: function(record, handler) {
                Scalr.cachedRequest.load(
                    {
                        url: '/platforms/openstack/xGetOpenstackResources',
                        params: {
                            cloudLocation: record.get('cloud_location'), 
                            platform: record.get('platform')
                        }
                    },
                    function(data, status){
                        var field,
                            ipPools = data ? data['ipPools'] : null;
                        
                        field = this.down('[name="openstack.ip-pool"]');
                        if (Scalr.getPlatformConfigValue(record.get('platform'), 'ext.floating_ips_enabled') == 1 && ipPools) {
                            field.store.load({ data:  ipPools});
                            field.show();
                            this.down('[name="openstack.cloud_location"]').hide();
                        } else {
                            field.hide();
                            this.down('[name="openstack.cloud_location"]').show();
                        }
                        handler();
                    },
                    this
                );
            },
            showTab: function(record) {
                var settings = record.get('settings', true),
                    field;
                
                field = this.down('[name="openstack.ip-pool"]');
                if (field.isVisible()) {
                    field.setValue(settings['openstack.ip-pool']);
                } else {
                    this.down('[name="openstack.cloud_location"]').setValue(record.get('cloud_location'));
                }
            },
            saveParam: function(name, value) {
                var record = this.currentRole,
                    settings = record.get('settings');
                settings[name] = value;
                record.set('settings', settings);
            }
        },

        cloudstack: {
            showTab: function(record) {
                this.down('[name="cloudstack.cloud_location"]').setValue(record.get('cloud_location'));
            },
            saveParam: function(name, value) {
                var record = this.currentRole,
                    settings = record.get('settings');
                settings[name] = value;
                record.set('settings', settings);
            }
        },
        
        gce: {
            beforeShowTab: function(record, handler) {
                this.cache = null;
                Scalr.cachedRequest.load(
                    {
                        url: '/platforms/gce/xGetOptions',
                        params: {}
                    },
                    function(data, status){
                        this.cache = data;
                        this.down('[name="gce.cloud-location"]').setDisabled(!status);
                        handler();
                    },
                    this
                );
           },
            showTab: function(record) {
                var data = this.cache || {},
                    field, zones = [],
                    settings = record.get('settings', true);
                
                field = this.down('[name="gce.cloud-location"]');
                if (settings['gce.region']) {
                    Ext.each(data['zones'], function(zone){
                        if (zone['name'].indexOf(settings['gce.region']) === 0) {
                            zones.push(zone);
                        }
                    });
                } else {
                    zones = data['zones'] || [];
                }
                field.store.loadData(zones);
                field.setValue(record.getGceCloudLocation());
            },
            saveParam: function(name, value) {
                var record = this.currentRole;
                if (name === 'gce.cloud-location') {
                    record.setGceCloudLocation(value);
                    Scalr.loadInstanceTypes(record.get('platform'), record.getGceCloudLocation()[0], Ext.bind(this.setupInstanceTypeField, this, [record], true));
                }
            }
        },

        items: [{
            xtype: 'container',
            flex: 1.5,
            minWidth: 320,
            maxWidth: 440,
            layout: 'anchor',
            cls: 'x-container-fieldset x-fieldset-separator-right',
            defaults: {
                labelWidth: 90,
                anchor: '100%'
            },
            items: [{
                xtype: 'textfield',
                name: 'alias',
                fieldLabel: 'Alias',
                hideOnMinify: true,
                margin: '0 0 6',
                validateOnChange: false,
                vtype: 'rolename',
                validator: function(value){
                    var error = false;
                    if (this.up('farmroleedit').farmRolesStore.countBy('alias', Ext.String.trim(value), this.up('#maintab').currentRole) > 0) {
                        error = 'Alias must be unique within the farm';
                    }
                    return error || true;
                },
                listeners: {
                    change: function(comp, value) {
                        if (comp.validate()) {
                            comp.up('#maintab').onParamChange(comp.name, Ext.String.trim(value));
                        }
                    }
                }
            },{
                xtype: 'container',
                hideOnMinify: true,
                layout: {
                    type: 'hbox',
                    align: 'middle'
                },
                height: 30,
                items: [{
                    xtype: 'label',
                    text: 'Role name:',
                    width: 95
                },{
                    xtype: 'component',
                    cls: 'x-overflow-ellipsis',
                    itemId: 'roleName',
                    flex: 1
                },{
                    xtype: 'button',
                    itemId: 'replaceRole',
                    hidden: true,
                    width: 30,
                    height: 20,
                    iconCls: 'x-icon-replace',
                    tooltip: 'Replace role',
                    padding: '2 0 0 7',
                    handler: function() {
                        Scalr.event.fireEvent('redirect','#/farms/roles/replaceRole?farmId=' + tabParams['farmId'] + '&farmRoleId=' + this.up('#maintab').currentRole.get('farm_role_id'));
                    }
                }]
            },{
                xtype: 'container',
                hideOnMinify: true,
                layout: {
                    type: 'hbox',
                    align: 'middle'
                },
                height: 30,
                margin: '0 0 6',
                items: [{
                    xtype: 'label',
                    text: 'OS:',
                    width: 95
                },{
                    xtype: 'component',
                    cls: 'x-overflow-ellipsis',
                    itemId: 'osName',
                    flex: 1
                }]
            },{
                xtype: 'instancetypefield',
                name: 'instanceType',
                labelWidth: 90,
                listeners: {
                    beforeselect: function(comp, record) {
                        //todo: quick solution - do better
                        var currentRole, storages, storageTab, allowChange = true, dbmsrTab;
                        currentRole = comp.up('#maintab').currentRole;
                        if (!record.get('ebsencryption') && currentRole.get('platform') === 'ec2') {
                            var tabsPanel = this.up('farmroleedit').down('#tabspanel');

                            dbmsrTab = tabsPanel.getComponent('dbmsr');
                            if (dbmsrTab && dbmsrTab.isVisible()) {
                                allowChange = dbmsrTab.down('[name="db.msr.data_storage.ebs.encrypted"]').getValue() ? false : true;
                            } else {
                                allowChange = currentRole.get('settings', true)['db.msr.data_storage.ebs.encrypted'] != 1;
                            }
                            if (!allowChange) Scalr.message.InfoTip('Instance type '+record.get('name') + ' doesn\'t support EBS encrypted storage', comp.inputEl, {anchor: 'bottom'});
                            //check storages
                            if (allowChange) {
                                storageTab = tabsPanel.getComponent('storage');
                                if (storageTab && storageTab.isVisible()) {
                                    storages = storageTab.getStorages();
                                } else {
                                    storages = (currentRole.get('storages', true)||{})['configs'];
                                }
                                if (storages) {
                                    Ext.each(storages, function(storage){
                                        if (storage.settings['ebs.encrypted'] == 1) {
                                            allowChange = false;
                                            return false;
                                        }
                                    });
                                    if (!allowChange) Scalr.message.InfoTip('Please remove EBS encrypted storages before changing instance type to '+record.get('name'), comp.inputEl, {anchor: 'bottom'});
                                }
                            }
                        }
                        return allowChange;
                    },
                    change: function(comp, value) {
                        var record = this.findRecordByValue(value),
                            tab = comp.up('#maintab');
                        if (record) {
                            tab.onParamChange(comp.name, value, record.get('name'));
                            tab.down('#instanceTypeDetails').update(record.getData());
                        } else {
                            tab.down('#instanceTypeDetails').update('&ndash;');
                        }
                    }
                }
            },{
                xtype: 'container',
                hideOnMinify: true,
                layout: {
                    type: 'hbox',
                    align: 'middle'
                },
                margin: '12 0 0 0',
                items: [{
                    xtype: 'label',
                    text: 'Configuration:',
                    width: 95
                },{
                    xtype: 'component',
                    cls: 'x-overflow-ellipsis',
                    itemId: 'instanceTypeDetails',
                    flex: 1,
                    html: '&nbsp;',
                    tpl: '<label class="x-label-grey">{[this.instanceTypeInfo(values)]}</label>'
                }]
            }]
        },{
            xtype: 'container',
            flex: 1,
            maxWidth: 320,
            minWidth: 260,
            cls: 'x-container-fieldset x-fieldset-separator-right',
            layout: 'anchor',
            defaults: {
                anchor: '100%'
            },
            items: [{
                xtype: 'cloudlocationmap',
                mode: 'single',
                itemId: 'cloud_location',
                margin: '10 0 16 0',
                hideOnMinify: true,
                listeners: {
                    selectlocation: function(location, state){
                        var tab = this.up('#maintab'),
                            record = tab.currentRole,
                            settings = record.get('settings', true);
                        //gce location beta
                        if (!settings['gce.region']) {
                            if (record.get('platform') === 'gce') {
                                var field = tab.down('[name="gce.cloud-location"]'),
                                    value;
                                if (field) {
                                    value = Ext.clone(field.getValue());
                                    if (state) {
                                        if (!Ext.Array.contains(value, location)) {
                                            value.push(location);
                                        }
                                    } else {
                                        if (value.length === 1) {
                                            Scalr.message.InfoTip('At least one zone must be selected!', field.inputEl);
                                        } else {
                                            Ext.Array.remove(value, location);
                                        }
                                    }
                                    field.setValue(value);
                                }
                            }
                        }
                    }
                }
            },{
                xtype: 'container',
                itemId: 'column2',
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                defaults: {
                    hidden: true
                },
                items: [{
                    xtype: 'container',
                    platform: ['ec2'],
                    hidden: false,
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    items:[{
                        xtype: 'comboradio',
                        fieldLabel: 'Avail zone',
                        flex: 1,
                        name: 'aws.availability_zone',
                        valueField: 'id',
                        displayField: 'name',
                        listConfig: {
                            cls: 'x-menu-light'
                        },
                        store: {
                            fields: [ 'id', 'name', 'state', 'disabled', 'items' ],
                            proxy: 'object'
                        },
                        margin: 0,
                        labelWidth: 70,
                        listeners: {
                            collapse: function() {
                                var value = this.getValue();
                                if (Ext.isObject(value) && value.items.length === 0) {
                                    this.setValue('');
                                }
                            },
                            change: function(comp, value) {
                                comp.up('#maintab').onParamChange(comp.name, value);
                            }
                        }
                    },{
                        xtype: 'displayinfofield',
                        itemId: 'aws_availability_zone_warn',
                        hidden: true,
                        margin: '0 0 0 10',
                        info: 'If you want to change placement, you need to remove Master EBS volume first.'
                    },{
                        xtype: 'displayfield',
                        fieldLabel: 'Cloud location',
                        labelWidth: 95,
                        name: 'aws.cloud_location',
                        hidden: true
                    }]
                },{
                    xtype: 'container',
                    platform: ['eucalyptus'],
                    layout: {
                        type: 'hbox',
                        align: 'stretch'
                    },
                    items:[{
                        xtype: 'comboradio',
                        fieldLabel: 'Avail zone',
                        flex: 1,
                        name: 'euca.availability_zone',
                        valueField: 'id',
                        displayField: 'name',
                        listConfig: {
                            cls: 'x-menu-light'
                        },
                        store: {
                            fields: [ 'id', 'name', 'state', 'disabled', 'items' ],
                            proxy: 'object'
                        },
                        margin: 0,
                        labelWidth: 70,
                        listeners: {
                            collapse: function() {
                                var value = this.getValue();
                                if (Ext.isObject(value) && value.items.length === 0) {
                                    this.setValue('');
                                }
                            },
                            change: function(comp, value) {
                                comp.up('#maintab').onParamChange(comp.name, value);
                            }
                        }
                    },{
                        xtype: 'displayinfofield',
                        itemId: 'euca_availability_zone_warn',
                        hidden: true,
                        margin: '0 0 0 10',
                        info: 'If you want to change placement, you need to remove Master EBS volume first.'
                    },{
                        xtype: 'displayfield',
                        fieldLabel: 'Cloud location',
                        labelWidth: 95,
                        name: 'euca.cloud_location',
                        hidden: true
                    }]
                },{
                    xtype: 'displayfield',
                    platform: ['rackspace'],
                    fieldLabel: 'Cloud location',
                    labelWidth: 95,
                    name: 'rs.cloud_location'
                },{
                    xtype: 'container',
                    checkPlatform: function(platform) {
                        return Scalr.isOpenstack(platform);
                    },
                    layout: 'fit',
                    items: [{
                        xtype: 'displayfield',
                        fieldLabel: 'Cloud location',
                        labelWidth: 95,
                        name: 'openstack.cloud_location'
                    },{
                        xtype: 'combo',
                        store: {
                            fields: [ 'id', 'name' ],
                            proxy: 'object'
                        },
                        valueField: 'id',
                        displayField: 'name',
                        labelWidth: 110,
                        fieldLabel: 'Floating IPs pool',
                        editable: false,
                        hidden: true,
                        queryMode: 'local',
                        name: 'openstack.ip-pool',
                        listeners: {
                            change: function(comp, value) {
                                comp.up('#maintab').onParamChange(comp.name, value);
                            }
                        }
                    }]
                },{
                    xtype: 'displayfield',
                    platform: ['cloudstack', 'idcf'],
                    fieldLabel: 'Cloud location',
                    labelWidth: 95,
                    name: 'cloudstack.cloud_location'
                },{
                    xtype: 'combobox',
                    fieldLabel: Scalr.flags['betaMode'] ? 'Avail zone' : 'Cloud location',
                    platform: ['gce'],
                    flex: 1,
                    multiSelect: true,
                    name: 'gce.cloud-location',
                    valueField: 'name',
                    displayField: 'description',
                    listConfig: {
                        cls: 'x-boundlist-with-icon',
                        tpl : '<tpl for=".">'+
                                '<tpl if="state != &quot;UP&quot;">'+
                                    '<div class="x-boundlist-item x-boundlist-item-disabled" title="Zone is offline for maintenance"><img class="x-boundlist-icon" src="' + Ext.BLANK_IMAGE_URL + '"/>{description}&nbsp;<span class="warning"></span></div>'+
                                '<tpl else>'+
                                    '<div class="x-boundlist-item"><img class="x-boundlist-icon" src="' + Ext.BLANK_IMAGE_URL + '"/>{description}</div>'+
                                '</tpl>'+
                              '</tpl>'
				    },
                    store: {
                        fields: [ 'name', {name: 'description', convert: function(v, record){return record.data.description || record.data.name;}}, 'state' ],
                        proxy: 'object',
                        sorters: ['name']
                    },
					editable: false,
					queryMode: 'local',
                    margin: 0,
                    labelWidth: 90,
                    listeners: {
                        beforeselect: function(comp, record, index) {
                            if (comp.isExpanded) {
                                return record.get('state') === 'UP';
                            }
                        },
                        beforedeselect: function(comp, record, index) {
                            if (comp.isExpanded) {
                                if (comp.getValue().length < 2) {
                                    Scalr.message.InfoTip('At least one zone must be selected!', comp.inputEl, {anchor: 'bottom'});
                                    return false;
                                } else {
                                    return true;
                                }
                            }
                        },
                        change: function(comp, value) {
                            var tab = comp.up('#maintab'), locations = [],
                                record = tab.currentRole,
                                settings = record.get('settings', true);

                            tab.onParamChange(comp.name, value);
                            tab.currentRole.set('cloud_location', value.length === 1 ? value[0] : 'x-scalr-custom');
                            //gce location beta
                            if (!settings['gce.region']) {
                                comp.store.data.each(function(){locations.push(this.get('name'))});
                                tab.down('#cloud_location').selectLocation(tab.currentRole.get('platform'), value, locations);
                            }
                        }
                    }
                }]
           }]
        },{
            xtype: 'container',
            itemId: 'mainscaling',
            layout: 'anchor',
            cls: 'x-container-fieldset',
            flex: 1.8,
            minWidth: 320,
            items: [{
                xtype: 'label',
                text: 'Scaling',
                itemId: 'mainscalingtitle',
                cls: 'x-fieldset-subheader',
                hideOnMinify: true
            },{
                xtype: 'container',
                anchor: '100%',
                layout: 'hbox',
                items: [{
                    xtype: 'textfield',
                    fieldLabel: 'Min&nbsp;instances',
                    labelWidth: 90,
                    width: 132,
                    margin: '0 18 0 0',
                    name: 'min_instances',
                    hideOnDisabled: true,
                    listeners: {
                        change: function(comp, value) {
                            comp.up('#maintab').onParamChange(comp.name, value);
                        }
                    }
                },{
                    xtype: 'textfield',
                    fieldLabel: 'Max&nbsp;instances',
                    labelWidth: 90,
                    width: 132,
                    margin: '0 18 0 0',
                    name: 'max_instances',
                    hideOnDisabled: true,
                    listeners: {
                        change: function(comp, value) {
                            comp.up('#maintab').onParamChange(comp.name, value);
                        }
                    }
                },{
                    xtype: 'displayfield',
                    fieldLabel: 'Running servers',
                    value: 0,
                    name: 'running_servers',
                    renderer: function(value) {
                        var html, tip;
                        if (value.suspended_servers > 0) {
                            tip = 'Running servers: <span style="color:#00CC00; cursor:pointer;">' + (value.running_servers || 0) + '</span>' +
                                  (value.suspended_servers > 0 ? '<br/>' + (value['base.consider_suspended'] === 'running' ? 'Including' : 'Not including') + ' <span style="color:#4DA6FF;">' + value.suspended_servers + '</span> Suspended server(s)' : '');
                        }
                        html = '<span data-anchor="right" data-qalign="r-l" data-qtip="' + (tip ? Ext.String.htmlEncode(tip) : '') + '" data-qwidth="270">' +
                               '<span style="color:#00CC00; cursor:pointer;">' + (value.running_servers || 0) + '</span>' +
                               (value.suspended_servers > 0 ? ' (<span style="color:#4DA6FF;">' + (value.suspended_servers || 0) + '</span>)' : '')+
                                '</span>';
                        return value.running_servers > 0 ? '<a href="#">' + html + '</a>' : html;
                    },
                    listeners: {
                        boxready: function() {
                            this.inputEl.on('click', function(e) {
                                var link = document.location.href.split('#'),
                                    farmRoleId = this.up('#maintab').currentRole.get('farm_role_id');
                                if (farmRoleId) {
                                    window.open(link[0] + '#/servers/view?farmId=' + tabParams['farmId'] + '&farmRoleId=' + farmRoleId);
                                }
                                e.preventDefault();
                            }, this);
                        }
                    }
                }]

            },{
                xtype: 'grid',
                itemId: 'mainscalinggrid',
                cls: 'x-grid-shadow',
                hideOnMinify: true,
                hideOnDisabled: true,
                margin: '16 0 0 0',
                enableColumnResize: false,
                maxWidth: 430,
                store: {
                    fields: ['id', 'name', 'max', 'min', 'last'],
                    proxy: 'object'
                },
                columns: [{
                    text: 'Metric',
                    sortable: false,
                    dataIndex: 'name',
                    flex: 1.6
                },{
                    text: 'Scale out',
                    xtype: 'templatecolumn',
                    tpl: '{max:htmlEncode}',
                    sortable: false,
                    flex: 1
                },{
                    text: 'Scale in',
                    xtype: 'templatecolumn',
                    tpl: '{min:htmlEncode}',
                    sortable: false,
                    flex: 1
                },{
                    text: 'Last value',
                    sortable: false,
                    dataIndex: 'last',
                    flex: 1
                }],
                viewConfig: {
                    focusedItemCls: '',
                    selectedItemCls: '',
                    overItemCls: '',
                    emptyText: 'No scaling rule yet added.',
                    deferEmptyText: false
                },
                loadMetrics: function(data) {
                    var dataToLoad = [],
                        metrics = tabParams['metrics'];
                    if (data) {
                        Ext.Object.each(data, function(id, value){
                            dataToLoad.push({
                                id:id, 
                                name: metrics[id].name, 
                                min: metrics[id].alias === 'ram' ? (value.max ? '> ' + value.max : '') : (value.min ? '< ' + value.min : ''), 
                                max: metrics[id].alias === 'ram' ? (value.min ? '< ' + value.min : '') : (value.max ? '> ' + value.max : ''), 
                                last: metrics[id].last || ''
                            });
                        })
                    }
                    this.store.loadData(dataToLoad);
                }

            }],
            setScalingDisabled: function(disabled) {
                this.suspendLayouts();
                this.down('#mainscalingtitle').setText(disabled ? ' <span style="color:#777">Auto scaling disabled</span>' : 'Scaling', false);
                Ext.Array.each(this.query('[hideOnDisabled]'), function(item){
                    item.setVisible(!disabled);
                    item.forceHidden = disabled;
                });
                this.resumeLayouts(true);
            }
        }]
	})
});

Ext.define('Ext.form.field.ComboBoxRadio', {
    extend:'Ext.form.field.ComboBox',
    alias: 'widget.comboradio',
    mixins: {
        bindable: 'Ext.util.Bindable'    
    },
	editable: false,
	queryMode: 'local',
	autoSelect: false,
    autoSearch: false,
		
    defaultListConfig: {},

    createPicker: function() {
        var me = this,
            picker,
            pickerCfg = Ext.apply({
            xtype: 'comboradiolist',
            pickerField: me,
            floating: true,
            hidden: true,
            store: me.store,
            displayField: me.displayField,
            valueField: me.valueField
            }, me.listConfig, me.defaultListConfig);
        
        picker = me.picker = Ext.widget(pickerCfg);

        me.mon(picker, {
            selectionchange: me.onListSelectionChange,
            refresh: me.onListRefresh,
            scope: me
        });

        return picker;
    },
	
    onListSelectionChange: function(value) {
        var me = this;
        if (!me.ignoreSelection && me.isExpanded) {
	        me.setValue(value, false);
	        me.fireEvent('select', me, value);
	        me.inputEl.focus();
	    }
    },
	
    findRecordByValue: function(value) {
        return this.findRecord(this.valueField, Ext.isObject(value)  ? value[this.valueField] : value);
    },
	
    setValue: function(value, doSelect) {
        var me = this,
            valueNotFoundText = me.valueNotFoundText,
            inputEl = me.inputEl,
            i, len, record,
            dataObj,
            matchedRecords = [],
            displayTplData = [],
            processedValue = [];

        if (me.store.loading) {
            me.value = value;
            return me;
        }

        value = Ext.Array.from(value);

        for (i = 0, len = value.length; i < len; i++) {
            record = value[i];
            if (!record || !record.isModel) {
                record = me.findRecordByValue(record);
            }
            if (record) {
            	var processedValueTmp, tplData;
                matchedRecords.push(record);
                if (Ext.isObject(value[i])) {
		            processedValueTmp = {};
	                processedValueTmp[me.valueField] = record.get(me.valueField);
	                if (value[i].items) {
                		processedValueTmp['items'] = value[i].items;
                        tplData = value[i].items.join(', ');
                	}
                	//todo check items
                } else {
                	processedValueTmp = record.get(me.valueField);
                    tplData = record.get(me.displayField);
                }
                processedValue.push(processedValueTmp);
                displayTplData.push(tplData);
            } else if (Ext.isDefined(valueNotFoundText)) {
                displayTplData.push(valueNotFoundText);
            }
        }

        me.value = me.multiSelect ? processedValue : processedValue[0];
        me.value;
        if (!Ext.isDefined(me.value)) {
            me.value = null;
        }
        me.displayTplData = displayTplData;
        me.lastSelection = me.valueModels = matchedRecords;

        if (inputEl && me.emptyText && !Ext.isEmpty(value)) {
            inputEl.removeCls(me.emptyCls);
        }

        me.setRawValue(me.getDisplayValue());
        me.checkChange();

        if (doSelect !== false) {
            me.syncSelection();
        }
        me.applyEmptyText();

        return me;
    },
    	
    getValue: function() {
        var me = this,
            picker = me.picker,
            rawValue = me.getRawValue(),
            value = me.value;

        if (me.getDisplayValue() !== rawValue) {
            value = rawValue;
            me.value = me.displayTplData = me.valueModels = null;
            if (picker) {
                me.ignoreSelection++;
                picker.items.each(function(item){
                	item.setChecked(false);
                });
                me.ignoreSelection--;
            }
        }

        return value;
    },

    isEqual: function(v1, v2) {
        var fromArray = Ext.Array.from,
            i, j, len;

        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;

        if (len !== v2.length) {
            return false;
        }

        for(i = 0; i < len; i++) {
        	if (Ext.isObject(v2[i])) {
        		if (v2[i][this.valueField] !== v1[i][this.valueField]) {
        			return false;
        		} else if (v2[i].items && v1[i].items && v2[i].items.length === v1[i].items.length){
        			for(j = 0; j < v2[i].items.length; j++) {
        				if (v2[i].items[j] != v2[i].items[j]) {
        					return false;
        				}
        			}
        		} else if (v2[i].items || v1[i].items){
        			return false;
        		}
        	} else if (v2[i] !== v1[i]) {
                return false;
            }
        }

        return true;
    },

   syncSelection: function() {
        var me = this,
            picker = me.picker;

        if (picker) {
        	var value, items, values = Ext.Array.from(me.value);
            me.ignoreSelection++;
            picker.items.each(function(item){
            	var checked = false;
            	for (var i=0, len=values.length; i<len; i++) {
            		value = null;
            		items = [];
            		if (Ext.isObject(values[i])) {
            			value = values[i][me.valueField];
            			items = values[i].items || [];
            		} else {
            			value = values[i];
            		}
	           		if (value == item.value) {
	           			checked = true;
            		} else if (items.length) {
            			for (var j=0, len1=items.length; j<len1; j++) {
		 	           		if (items[j] == item.value) {
			           			checked = true;
			           			break;
			           		}
		            	}
            		}
            		if (checked) {
            			break;
            		}
            	}
            	item.setChecked(checked);
            });
            me.ignoreSelection--;
        }
    }    	
});

Ext.define('Ext.view.ComboRadioList', {
    extend: 'Ext.menu.Menu',
    alias: 'widget.comboradiolist',
    mixins: {
        bindable: 'Ext.util.Bindable'
    },
    baseCls: 'x-comboradiolist',
    initComponent: function() {
        var me = this;
	    	
        me.store = Ext.data.StoreManager.lookup(me.store || 'ext-empty-store');
        me.bindStore(me.store, true);
        
        me.callParent();
        me.onDataRefresh();
    },
    
    onShow: function(){
    	this.callParent();
    	this.fireEvent('refresh');
    },
    
    onItemClick: function(item) {
        var me = this,
            checked = item.checked;
    	if (checked || item.parentValue !== undefined) {
    		var params;
    		
	    	if (item.hasItems || item.parentValue !== undefined) {
	    		params = {};
	    		params[me.valueField] = item.record.get(me.valueField);
	    		params.items = [];
	    		var items = me.query('[parentValue='+params[me.valueField]+']');
	    		for (var i=0, len=items.length; i<len; i++) {
	    			if (items[i].checked) {
	    				params.items.push(items[i].value);
	    			}
	    		}
                if (item.parentValue !== undefined) {
                    me.down('[value="'+item.parentValue+'"]').setChecked(true);
                }
	    	} else {
	    		params = item.record.get(me.valueField);
	    	}
    		me.fireEvent('selectionchange', params);
    	}
    	
		if (checked && item.group !== undefined && !item.hasItems) {
			me.pickerField.collapse();
		}
    },
    
    bindStore : function(store, initial) {
        var me = this;
        me.mixins.bindable.bindStore.apply(me, arguments);
    },
    
    onDataRefresh: function() {
        var me = this,
            clickHandler = Ext.bind(me.onItemClick, me);
        me.removeAll();
        (me.store.snapshot || me.store.data).each(function(record) {
        	var value = record.get(me.valueField),
        		text = record.get(me.displayField),
        		items = record.get('items');
        	me.add({
                xtype: 'menucheckitem',
                group: me.getId(),
                hasItems: items ? true : false,
                text: text,
                value: value,
                hideOnClick: false,
                record: record,
                handler: clickHandler
            });
            if (items) {
            	for (var i=0, len=items.length; i<len; i++) {
		        	me.add({
                        xtype: 'menucheckitem',
                        cls: 'x-subitem' + (items[i].disabled ? ' x-menu-item-disabled-forced' : ''),
		                parentValue: value,
                        tooltip: items[i].disabled ? 'Zone is offline for maintenance' : null,
                        tooltipType: 'title',
		                text: items[i][me.displayField],
		                value: items[i][me.valueField],
		                disabled: items[i].disabled || false,
		                record: record,
                        handler: clickHandler
		            });
            	}
            }
        });
        me.fireEvent('refresh');
    },
    
    getStoreListeners: function() {
        var me = this;
        return {
            refresh: me.onDataRefresh,
            add: me.onDataRefresh,
            remove: me.onDataRefresh,
            update: me.onDataRefresh,
            clear: me.onDataRefresh
        };
    },

    onDestroy: function() {
        this.bindStore(null);
        this.callParent();
    }
});

Ext.define('Scalr.ui.FarmsBuilderTab', {
	extend: 'Ext.panel.Panel',
	tabTitle: '',
	autoScroll: true,
    cls: 'scalr-ui-farmbuilder-roleedit-tab x-panel-column-left',
    layout: 'anchor',
    
	currentRole: null,
    
    tab: 'tab',
    
    initComponent: function() {
        if (this.itemId !== 'maintab' && this.itemId !== 'scaling' && this.itemId !== 'dbmsr' && this.itemId !== 'ec2') {//tabs with onRoleUpdate add here
            this.hiddenItems = this.items;
            delete this.items;
        }
        
        this.callParent(arguments);
        this.on({
            activate: function () {
                var me = this,
                    handler = function(){
                        me.activateTab();
                        me.showTab(me.currentRole);
                        me.highlightErrors();
                    };
                if (me.items.length === 0) {
                    me.add(me.hiddenItems);
                }
                if (me.itemId !== 'maintab') {
                    me.deactivateTab(true);
                }
                me.beforeShowTab(this.currentRole, handler);
                me.up('farmroleedit').onTabActivate(me);
            },
            deactivate: function () {
                if (!this.deactivated) {
                    this.hideTab(this.currentRole);
                }
                this.clearErrors();
                this.tabButton.removeCls('x-btn-tab-invalid');
                this.up('farmroleedit').onTabDeactivate(this);
            },
            added: {
                fn: function() {
                    if (this.onRoleUpdate !== undefined) {
                        this.up('farmroleedit').farmRolesStore.on('roleupdate', this.onRoleUpdate, this);
                    }
                },
                scope: this,
                single: true
            }
        });
        
    },
    
	setCurrentRole: function (record, activate) {
        var enabled = this.isActive(record),
            hasError;
		this.currentRole = record;
        this.tabButton.setVisible(enabled);
        if (enabled) {
            if (this.getTitle !== undefined) {
                this.tabButton.setText(this.getTitle(record));
            }
            hasError = this.hasError();
            if (activate === true || hasError && activate !== 'error' ) {
                this.ownerCt.layout.setActiveItem(this);
                this.tabButton.toggle(true);
                activate = hasError ? 'error' : false;
            }
            this.tabButton[hasError ? 'addCls' : 'removeCls']('x-btn-tab-invalid');
        }
        return activate;
	},
    
    hasError: function(){
        var me = this, 
            errors = me.currentRole.get('errors', true),
            hasError = false;
        if (errors) {
            var tabSettings = me.getSettingsList();
            if (tabSettings !== undefined) {
                Ext.Object.each(errors, function(name, error){
                    if (name in tabSettings) {
                        hasError = true;
                        return false;
                    }
                });
            }
        }
        return hasError;
    },
    
	highlightErrors: function () {
        var me = this,
            errors;
        if (me.currentRole) {
            errors = me.currentRole.get('errors', true);
            if (errors) {
                var tabSettings = me.getSettingsList(),
                    counter = 0;
                if (tabSettings !== undefined) {
                    Ext.Object.each(errors, function(name, error){
                        if (name in tabSettings) {
                            var field = me.down('[name="' + name + '"]');
                            if (field && field.markInvalid) {
                                field.markInvalid(error);
                            } else if (!counter) {
                                Scalr.message.Flush(true);
                                Scalr.message.Error(error);
                                counter++;
                            }
                        }
                    });
                }
            }
        }
    },

	clearErrors: function () {
        var errors;
        if (this.currentRole) {
            errors = this.currentRole.get('errors', true);
            if (errors) {
                var tabSettings = this.getSettingsList();
                if (tabSettings !== undefined) {
                    Ext.Object.each(errors, function(name, error){
                        if (name in tabSettings) {
                            delete errors[name];
                        }
                    });
                }
                if (Ext.Object.getSize(errors) === 0) {
                    this.currentRole.set('errors', null);
                }
            }
        }
    },

	beforeShowTab: function (record, handler) {
		this.el.unmask();
		handler();
	},

	// show tab
	showTab: function (record) {},

	// hide tab
	hideTab: function (record) {},

    deactivateTab: function (noMessage) {
        this.deactivated = true;
		this.el.mask(noMessage ? null : 'Unable to load data from server.', 'x-mask-error');
	},

    activateTab: function () {
        this.deactivated = false;
        this.el.unmask();
	},
    
	// tab can show or used for this role
	isEnabled: function (record) {
		return true;
	},

	isActive: function (record) {
        if (record.isVpcRouter()) {
            return Ext.Array.contains(['vpcrouter', 'devel', 'network'], this.itemId) && this.isEnabled(record);
        } else {
            return this.itemId !== 'vpcrouter' && this.isEnabled(record);
        }
	},

	getDefaultValues: function (record, roleDefaultSettings) {
        var me = this,
            values = {};
        if (me.settings !== undefined) {
            Ext.Object.each(me.settings, function(name, defaultValue){
                if (roleDefaultSettings !== undefined && roleDefaultSettings[name] !== undefined) {
                    values[name] = roleDefaultSettings[name];
                } else if (defaultValue !== undefined) {
                    values[name] = Ext.isFunction(defaultValue) ? defaultValue.call(me, record) : defaultValue;
                }
            });
        }
		return values;
	},
    
    getSettingsList: function() {
        return this.settings;
	},
    
    suspendOnRoleUpdate: 0
    //difining this method in tab will allow to react to a role settings update
    //onRoleUpdate: function(record, name, value, oldValue) {},
    
});
	
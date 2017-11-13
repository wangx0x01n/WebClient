angular.module('proton.contact')
    .directive('contactItem', ($timeout, $rootScope, contactTransformLabel, contactUI, messageModel) => {
        const AS_SORTABLE_DISABLED = 'as-sortable-disabled';
        const addX = (value = '') => (value.startsWith('x') ? value : `X-${value}`);

        return {
            restrict: 'E',
            require: '^form',
            templateUrl: 'templates/directives/contact/contactItem.tpl.html',
            scope: {
                form: '=',
                model: '=',
                state: '=',
                getDatas: '&datas',
                type: '@type'
            },
            link(scope, element, attr, ngFormController) {
                const datas = scope.getDatas();
                const type = scope.type;
                const state = scope.state;
                const list = element.find('.contactItem-container');

                list.addClass(`contactItem-container-${scope.type}`);
                list.addClass(AS_SORTABLE_DISABLED);

                function onClick({ target }) {
                    const action = target.getAttribute('data-action');
                    const index = parseInt(target.getAttribute('data-index'), 10);
                    switch (action) {
                        case 'add':
                            add();
                            break;
                        case 'composeTo':
                            composeTo(target.getAttribute('data-email'));
                            break;
                        case 'remove':
                            remove(scope.UI.items[index]);
                            break;
                        case 'toggleSortable':
                            scope.$applyAsync(() => {
                                scope.UI.sortableState = !scope.UI.sortableState;
                                list.toggleClass(AS_SORTABLE_DISABLED);
                            });
                            break;
                        default:
                            break;
                    }
                }

                function add() {
                    const populated = contactUI.populate(scope.UI, type);
                    ngFormController.$setDirty();
                    scope.$applyAsync(() => {
                        contactUI.add(scope.UI, populated.key, populated.type, '');
                        setTimeout(() => element.find('.contactItem-field').focus(), 100);
                    });
                }

                function remove(item) {
                    // Hide all the tooltip
                    $('.tooltip').not(this).hide();
                    contactUI.remove(scope.UI, item);
                    ngFormController.$setDirty();
                    scope.change();
                }

                function composeTo(email) {
                    const message = messageModel();

                    message.ToList = [ { Address: email, Name: email } ];
                    $rootScope.$emit('composer.new', { message, type: 'new' });
                }

                // Drag and Drop configuration
                scope.itemContactDragControlListeners = {
                    containment: '.contactDetails-container',
                    containerPositioning: 'relative',
                    accept(sourceItemHandleScope, destSortableScope) {
                        return sourceItemHandleScope.itemScope.sortableScope.$id === destSortableScope.$id;
                    },
                    dragStart() {
                        scope.itemMoved = true;
                    },
                    dragEnd() {
                        scope.itemMoved = false;
                    },
                    orderChanged() {
                        ngFormController.$setDirty();
                    }
                };

                scope.UI = contactUI.initialize(datas, type, state);
                scope.change = () => scope.$applyAsync(() => (scope.model[type] = scope.UI.items));
                scope.visibleItems = () => scope.UI.items.filter(({ hide }) => !hide);

                scope.getAddressValue = (item) => {
                    const itemValue = item.value;

                    if (angular.isArray(itemValue)) {
                        return itemValue.join(' ');
                    }

                    if (angular.isString(itemValue)) {
                        return itemValue;
                    }

                    return '';
                };

                scope.toggleSelector = (event, item) => {
                    setTimeout(() => {
                        if (!item.displaySelector) {
                            event.stopPropagation();
                        }
                    }, 100);
                };

                scope.setLabel = (item = {}, value = '') => {
                    item.label = value || item.label;

                    if (type === 'Customs') {
                        item.type = addX(item.label);
                    } else {
                        item.type = contactTransformLabel.toVCard(item.label);
                    }

                    ngFormController.$setDirty();
                    scope.change();
                };

                scope.change();

                element.on('click', onClick);

                scope.$on('$destroy', () => {
                    element.off('click', onClick);
                });
            }
        };
    });
